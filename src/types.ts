import * as pulumi from "@pulumi/pulumi";

/**
 * Input arguments for the VPC component
 */
export interface VpcArgs {
    /**
     * The CIDR block for the VPC
     * Example: "10.0.0.0/16"
     */
    cidrBlock: string;

    /**
     * List of availability zones to create subnets in
     * Example: ["us-west-2a", "us-west-2b", "us-west-2c"]
     */
    availabilityZones: string[];

    /**
     * CIDR blocks for public subnets (must match availabilityZones length)
     * Example: ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
     */
    publicSubnetCidrs: string[];

    /**
     * CIDR blocks for private subnets (must match availabilityZones length)
     * Example: ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
     */
    privateSubnetCidrs: string[];

    /**
     * Environment name (e.g., "dev", "staging", "prod")
     * Used for tagging and resource naming
     */
    environment: string;

    /**
     * Project name
     * Used for tagging and resource naming
     */
    project: string;

    /**
     * Instance tenancy for the VPC
     * Default: "default"
     */
    instanceTenancy?: "default" | "dedicated";

    /**
     * Whether to enable NAT Gateways for private subnets
     * Default: true
     */
    enableNatGateway?: boolean;

    /**
     * Whether to enable VPC Flow Logs
     * Default: true
     */
    enableFlowLogs?: boolean;

    /**
     * Retention period for Flow Logs in days
     * Default: 7
     */
    flowLogRetentionDays?: number;

    /**
     * Additional tags to apply to all resources
     */
    tags?: Record<string, string>;
}

/**
 * Output values from the VPC component
 */
export interface VpcResult {
    /**
     * The ID of the created VPC
     */
    vpcId: pulumi.Output<string>;

    /**
     * The CIDR block of the VPC
     */
    vpcCidr: pulumi.Output<string>;

    /**
     * Array of public subnet IDs
     */
    publicSubnetIds: pulumi.Output<string[]>;

    /**
     * Array of private subnet IDs
     */
    privateSubnetIds: pulumi.Output<string[]>;

    /**
     * ID of the public route table
     */
    publicRouteTableId: pulumi.Output<string>;

    /**
     * Array of private route table IDs
     */
    privateRouteTableIds: pulumi.Output<string[]>;

    /**
     * Array of NAT Gateway IDs (if enabled)
     */
    natGatewayIds: pulumi.Output<string[]>;

    /**
     * ID of the Internet Gateway
     */
    internetGatewayId: pulumi.Output<string>;

    /**
     * ID of the Flow Log (if enabled)
     */
    flowLogId: pulumi.Output<string | undefined>;
} 