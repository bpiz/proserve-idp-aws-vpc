import * as pulumi from "@pulumi/pulumi";
import { Vpc } from "../../src";

// Create a basic VPC with public and private subnets
const vpc = new Vpc("example-vpc", {
  cidrBlock: "10.0.0.0/16",
  availabilityZones: ["us-east-1a", "us-east-1b"],
  publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
  privateSubnetCidrs: ["10.0.11.0/24", "10.0.12.0/24"],
  environment: "dev",
  project: "example-project",
  enableNatGateway: true,
  enableFlowLogs: true,
  flowLogRetentionDays: 7,
  tags: {
    Owner: "platform-team",
    CostCenter: "platform",
  },
});

// Export the VPC ID and subnet IDs
export const vpcId = vpc.vpcId;
export const vpcCidr = vpc.vpcCidr;
export const publicSubnetIds = vpc.publicSubnetIds;
export const privateSubnetIds = vpc.privateSubnetIds;
export const natGatewayIds = vpc.natGatewayIds;
export const internetGatewayId = vpc.internetGatewayId;
