import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { VpcArgs } from "./types";

/**
 * Enterprise-ready AWS VPC component with security best practices
 *
 * This component creates a secure VPC with:
 * - Public and private subnets across multiple AZs
 * - NAT Gateways for private subnet internet access
 * - Security groups with least privilege access
 * - Flow logs for network monitoring
 * - Proper tagging for cost allocation
 * - CrossGuard compliance ready
 */
export class Vpc extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly vpcCidr: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string[]>;
  public readonly privateSubnetIds: pulumi.Output<string[]>;
  public readonly publicRouteTableId: pulumi.Output<string>;
  public readonly privateRouteTableIds: pulumi.Output<string[]>;
  public readonly natGatewayIds: pulumi.Output<string[]>;
  public readonly internetGatewayId: pulumi.Output<string>;
  public readonly flowLogId: pulumi.Output<string | undefined>;

  constructor(
    name: string,
    args: VpcArgs,
    opts?: pulumi.ComponentResourceOptions,
  ) {
    super("proserve:aws:Vpc", name, args, opts);

    // Validate inputs
    this.validateArgs(args);

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: args.cidrBlock,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        instanceTenancy: args.instanceTenancy || "default",
        tags: {
          Name: `${name}-vpc`,
          Environment: args.environment,
          Project: args.project,
          ManagedBy: "pulumi",
          ...args.tags,
        },
      },
      { parent: this },
    );

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: vpc.id,
        tags: {
          Name: `${name}-igw`,
          Environment: args.environment,
          Project: args.project,
          ManagedBy: "pulumi",
        },
      },
      { parent: this },
    );

    // Create public subnets
    const publicSubnets = args.availabilityZones.map((az, index) => {
      const subnet = new aws.ec2.Subnet(
        `${name}-public-${az}`,
        {
          vpcId: vpc.id,
          cidrBlock: args.publicSubnetCidrs[index]!,
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            Name: `${name}-public-${az}`,
            Environment: args.environment,
            Project: args.project,
            Type: "public",
            ManagedBy: "pulumi",
          },
        },
        { parent: this },
      );
      return subnet;
    });

    // Create private subnets
    const privateSubnets = args.availabilityZones.map((az, index) => {
      const subnet = new aws.ec2.Subnet(
        `${name}-private-${az}`,
        {
          vpcId: vpc.id,
          cidrBlock: args.privateSubnetCidrs[index]!,
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            Name: `${name}-private-${az}`,
            Environment: args.environment,
            Project: args.project,
            Type: "private",
            ManagedBy: "pulumi",
          },
        },
        { parent: this },
      );
      return subnet;
    });

    // Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: vpc.id,
        routes: [
          {
            cidrBlock: "0.0.0.0/0",
            gatewayId: internetGateway.id,
          },
        ],
        tags: {
          Name: `${name}-public-rt`,
          Environment: args.environment,
          Project: args.project,
          Type: "public",
          ManagedBy: "pulumi",
        },
      },
      { parent: this },
    );

    // Associate public subnets with public route table
    publicSubnets.map((subnet, index) => {
      return new aws.ec2.RouteTableAssociation(
        `${name}-public-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this },
      );
    });

    // Create NAT Gateways and private route tables
    const natGateways: aws.ec2.NatGateway[] = [];
    const privateRouteTables: aws.ec2.RouteTable[] = [];

    if (args.enableNatGateway !== false) {
      // Allocate Elastic IPs for NAT Gateways
      const natEips = args.availabilityZones.map((az) => {
        return new aws.ec2.Eip(
          `${name}-nat-eip-${az}`,
          {
            domain: "vpc",
            tags: {
              Name: `${name}-nat-eip-${az}`,
              Environment: args.environment,
              Project: args.project,
              ManagedBy: "pulumi",
            },
          },
          { parent: this },
        );
      });

      // Create NAT Gateways
      natGateways.push(
        ...args.availabilityZones.map((az, index) => {
          const natGateway = new aws.ec2.NatGateway(
            `${name}-nat-${az}`,
            {
              allocationId: natEips[index]!.id,
              subnetId: publicSubnets[index]!.id,
              tags: {
                Name: `${name}-nat-${az}`,
                Environment: args.environment,
                Project: args.project,
                ManagedBy: "pulumi",
              },
            },
            { parent: this },
          );
          return natGateway;
        }),
      );

      // Create private route tables with NAT Gateway routes
      privateRouteTables.push(
        ...args.availabilityZones.map((az, index) => {
          const routeTable = new aws.ec2.RouteTable(
            `${name}-private-rt-${az}`,
            {
              vpcId: vpc.id,
              routes: [
                {
                  cidrBlock: "0.0.0.0/0",
                  natGatewayId: natGateways[index]!.id,
                },
              ],
              tags: {
                Name: `${name}-private-rt-${az}`,
                Environment: args.environment,
                Project: args.project,
                Type: "private",
                ManagedBy: "pulumi",
              },
            },
            { parent: this },
          );
          return routeTable;
        }),
      );
    } else {
      // Create private route tables without NAT Gateway routes
      privateRouteTables.push(
        ...args.availabilityZones.map((az) => {
          const routeTable = new aws.ec2.RouteTable(
            `${name}-private-rt-${az}`,
            {
              vpcId: vpc.id,
              tags: {
                Name: `${name}-private-rt-${az}`,
                Environment: args.environment,
                Project: args.project,
                Type: "private",
                ManagedBy: "pulumi",
              },
            },
            { parent: this },
          );
          return routeTable;
        }),
      );
    }

    // Associate private subnets with private route tables
    privateSubnets.map((subnet, index) => {
      return new aws.ec2.RouteTableAssociation(
        `${name}-private-rta-${index}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTables[index]!.id,
        },
        { parent: this },
      );
    });

    // Create default security groups
    new aws.ec2.DefaultSecurityGroup(
      `${name}-default-sg`,
      {
        vpcId: vpc.id,
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
        tags: {
          Name: `${name}-default-sg`,
          Environment: args.environment,
          Project: args.project,
          ManagedBy: "pulumi",
        },
      },
      { parent: this },
    );

    // Create Flow Logs if enabled
    let flowLog: aws.ec2.FlowLog | undefined;
    if (args.enableFlowLogs !== false) {
      // Create CloudWatch Log Group for Flow Logs
      const flowLogGroup = new aws.cloudwatch.LogGroup(
        `${name}-flow-logs`,
        {
          name: `/aws/vpc/flow-logs/${name}`,
          retentionInDays: args.flowLogRetentionDays || 7,
          tags: {
            Environment: args.environment,
            Project: args.project,
            ManagedBy: "pulumi",
          },
        },
        { parent: this },
      );

      // Create IAM Role for Flow Logs
      const flowLogRole = new aws.iam.Role(
        `${name}-flow-log-role`,
        {
          assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
            Service: "vpc-flow-logs.amazonaws.com",
          }),
          tags: {
            Environment: args.environment,
            Project: args.project,
            ManagedBy: "pulumi",
          },
        },
        { parent: this },
      );

      // Attach policy to role
      new aws.iam.RolePolicy(
        `${name}-flow-log-policy`,
        {
          role: flowLogRole.id,
          policy: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Action: [
                  "logs:CreateLogGroup",
                  "logs:CreateLogStream",
                  "logs:PutLogEvents",
                  "logs:DescribeLogGroups",
                  "logs:DescribeLogStreams",
                ],
                Resource: flowLogGroup.arn,
              },
            ],
          },
        },
        { parent: this },
      );

      // Create Flow Log
      flowLog = new aws.ec2.FlowLog(
        `${name}-flow-log`,
        {
          vpcId: vpc.id,
          trafficType: "ALL",
          logDestination: flowLogGroup.arn,
          iamRoleArn: flowLogRole.arn,
          tags: {
            Name: `${name}-flow-log`,
            Environment: args.environment,
            Project: args.project,
            ManagedBy: "pulumi",
          },
        },
        { parent: this },
      );
    }

    // Set outputs
    this.vpcId = vpc.id;
    this.vpcCidr = vpc.cidrBlock;
    this.publicSubnetIds = pulumi.all(publicSubnets.map((s) => s.id));
    this.privateSubnetIds = pulumi.all(privateSubnets.map((s) => s.id));
    this.publicRouteTableId = publicRouteTable.id;
    this.privateRouteTableIds = pulumi.all(
      privateRouteTables.map((rt) => rt.id),
    );
    this.natGatewayIds = pulumi.all(natGateways.map((ng) => ng.id));
    this.internetGatewayId = internetGateway.id;
    this.flowLogId = flowLog
      ? flowLog.id
      : pulumi.output(undefined as string | undefined);

    this.registerOutputs({
      vpcId: this.vpcId,
      vpcCidr: this.vpcCidr,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      publicRouteTableId: this.publicRouteTableId,
      privateRouteTableIds: this.privateRouteTableIds,
      natGatewayIds: this.natGatewayIds,
      internetGatewayId: this.internetGatewayId,
      flowLogId: this.flowLogId,
    });
  }

  /**
   * Validates the input arguments
   */
  private validateArgs(args: VpcArgs): void {
    if (!args.cidrBlock) {
      throw new Error("cidrBlock is required");
    }

    if (!args.availabilityZones || args.availabilityZones.length === 0) {
      throw new Error("availabilityZones must be provided and non-empty");
    }

    if (
      !args.publicSubnetCidrs ||
      args.publicSubnetCidrs.length !== args.availabilityZones.length
    ) {
      throw new Error(
        "publicSubnetCidrs must be provided and match the number of availability zones",
      );
    }

    if (
      !args.privateSubnetCidrs ||
      args.privateSubnetCidrs.length !== args.availabilityZones.length
    ) {
      throw new Error(
        "privateSubnetCidrs must be provided and match the number of availability zones",
      );
    }

    if (!args.environment) {
      throw new Error("environment is required");
    }

    if (!args.project) {
      throw new Error("project is required");
    }

    // Validate CIDR blocks
    this.validateCidrBlock(args.cidrBlock, "VPC CIDR");
    args.publicSubnetCidrs.forEach((cidr, index) => {
      this.validateCidrBlock(cidr, `Public subnet ${index} CIDR`);
    });
    args.privateSubnetCidrs.forEach((cidr, index) => {
      this.validateCidrBlock(cidr, `Private subnet ${index} CIDR`);
    });
  }

  /**
   * Validates a CIDR block format
   */
  private validateCidrBlock(cidr: string, name: string): void {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
    if (!cidrRegex.test(cidr)) {
      throw new Error(`${name} must be a valid CIDR block (e.g., 10.0.0.0/16)`);
    }

    const parts = cidr.split("/");
    const ip = parts[0]!;
    const prefix = parseInt(parts[1]!);

    if (prefix < 8 || prefix > 30) {
      throw new Error(`${name} prefix must be between 8 and 30`);
    }

    const ipParts = ip.split(".").map(Number);
    if (ipParts.some((part) => part < 0 || part > 255)) {
      throw new Error(`${name} contains invalid IP address`);
    }
  }
}
