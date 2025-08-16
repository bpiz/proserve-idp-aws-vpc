import * as pulumi from "@pulumi/pulumi";
import { Vpc } from "../../src";

// Create an advanced VPC with 3 AZs and custom configurations
const vpc = new Vpc("advanced-vpc", {
  cidrBlock: "172.16.0.0/16",
  availabilityZones: ["us-east-1a", "us-east-1b", "us-east-1c"],
  publicSubnetCidrs: ["172.16.1.0/24", "172.16.2.0/24", "172.16.3.0/24"],
  privateSubnetCidrs: ["172.16.11.0/24", "172.16.12.0/24", "172.16.13.0/24"],
  environment: "production",
  project: "enterprise-platform",
  instanceTenancy: "default",
  enableNatGateway: true,
  enableFlowLogs: true,
  flowLogRetentionDays: 30,
  tags: {
    Owner: "platform-team",
    CostCenter: "platform",
    Compliance: "pci-dss",
    Backup: "daily",
    Monitoring: "enabled",
  },
});

// Export all outputs for reference
export const vpcId = vpc.vpcId;
export const vpcCidr = vpc.vpcCidr;
export const publicSubnetIds = vpc.publicSubnetIds;
export const privateSubnetIds = vpc.privateSubnetIds;
export const publicRouteTableId = vpc.publicRouteTableId;
export const privateRouteTableIds = vpc.privateRouteTableIds;
export const natGatewayIds = vpc.natGatewayIds;
export const internetGatewayId = vpc.internetGatewayId;
export const flowLogId = vpc.flowLogId;
