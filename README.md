# AWS VPC Component

Enterprise-ready AWS VPC component with security best practices.

## Features

- **Multi-AZ Support**: Create VPCs across multiple availability zones
- **Public & Private Subnets**: Separate public and private subnets with proper routing
- **NAT Gateways**: Optional NAT Gateways for private subnet internet access
- **Flow Logs**: Optional VPC Flow Logs for network monitoring
- **Security Groups**: Default security groups with least privilege access
- **Enterprise Tagging**: Comprehensive tagging for cost allocation and compliance
- **Input Validation**: Robust input validation with clear error messages
- **CrossGuard Ready**: Designed for Pulumi CrossGuard policy compliance

## Installation

```bash
npm install @proserve/aws-vpc
```

## Usage

### Basic Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import { Vpc } from "@proserve/aws-vpc";

const vpc = new Vpc("my-vpc", {
    cidrBlock: "10.0.0.0/16",
    availabilityZones: ["us-west-2a", "us-west-2b"],
    publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
    privateSubnetCidrs: ["10.0.11.0/24", "10.0.12.0/24"],
    environment: "dev",
    project: "my-project",
    enableNatGateway: true,
    enableFlowLogs: true,
    tags: {
        Owner: "platform-team",
        CostCenter: "platform",
    },
});

export const vpcId = vpc.vpcId;
export const publicSubnetIds = vpc.publicSubnetIds;
export const privateSubnetIds = vpc.privateSubnetIds;
```

### Advanced Example

```typescript
import * as pulumi from "@pulumi/pulumi";
import { Vpc } from "@proserve/aws-vpc";

const vpc = new Vpc("production-vpc", {
    cidrBlock: "172.16.0.0/16",
    availabilityZones: ["us-west-2a", "us-west-2b", "us-west-2c"],
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
```

## Configuration

### Required Parameters

- `cidrBlock`: The CIDR block for the VPC (e.g., "10.0.0.0/16")
- `availabilityZones`: List of availability zones to create subnets in
- `publicSubnetCidrs`: CIDR blocks for public subnets (must match AZ count)
- `privateSubnetCidrs`: CIDR blocks for private subnets (must match AZ count)
- `environment`: Environment name (e.g., "dev", "staging", "prod")
- `project`: Project name for tagging

### Optional Parameters

- `instanceTenancy`: Instance tenancy ("default" or "dedicated")
- `enableNatGateway`: Whether to enable NAT Gateways (default: true)
- `enableFlowLogs`: Whether to enable VPC Flow Logs (default: true)
- `flowLogRetentionDays`: Retention period for Flow Logs in days (default: 7)
- `tags`: Additional tags to apply to all resources

## Outputs

- `vpcId`: The ID of the created VPC
- `vpcCidr`: The CIDR block of the VPC
- `publicSubnetIds`: Array of public subnet IDs
- `privateSubnetIds`: Array of private subnet IDs
- `publicRouteTableId`: ID of the public route table
- `privateRouteTableIds`: Array of private route table IDs
- `natGatewayIds`: Array of NAT Gateway IDs (if enabled)
- `internetGatewayId`: ID of the Internet Gateway
- `flowLogId`: ID of the Flow Log (if enabled)

## Examples

See the `examples/` directory for complete working examples:

- `examples/basic/`: Basic VPC setup with 2 AZs
- `examples/advanced/`: Advanced VPC setup with 3 AZs and production settings

### Running Examples

```bash
# Navigate to an example directory
cd examples/basic

# Install dependencies
npm install

# Preview the deployment
npm run preview

# Deploy the VPC
npm run up

# Destroy the VPC
npm run destroy
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Coverage

The component includes comprehensive tests covering:

- Input validation
- Component creation
- Error handling
- Output validation
- Edge cases

### Test Structure

- `src/__tests__/vpc.test.ts`: Main test suite
- `src/__tests__/setup.ts`: Test setup and configuration

## Development

### Building

```bash
npm run build
```

### Linting

```bash
npm run lint
npm run lint:fix
```

### Publishing

```bash
npm run prepublishOnly
npm publish
```

## Security Features

- **Least Privilege Access**: Security groups with minimal required access
- **Network Segmentation**: Separate public and private subnets
- **Flow Logs**: Network traffic monitoring and logging
- **Encryption**: Support for encryption at rest and in transit
- **Audit Logging**: Comprehensive resource tagging for audit trails

## Best Practices

1. **CIDR Planning**: Plan your CIDR blocks carefully to avoid conflicts
2. **Multi-AZ Deployment**: Use multiple availability zones for high availability
3. **NAT Gateway Costs**: Consider costs when enabling NAT Gateways
4. **Flow Logs**: Enable Flow Logs for security monitoring
5. **Tagging**: Use consistent tagging for cost allocation and compliance
6. **Security Groups**: Review and customize security group rules as needed

## Troubleshooting

### Common Issues

1. **CIDR Conflicts**: Ensure VPC and subnet CIDRs don't overlap
2. **AZ Availability**: Verify availability zones are available in your region
3. **NAT Gateway Costs**: NAT Gateways incur hourly charges
4. **Flow Log Permissions**: Ensure IAM permissions for Flow Log creation

### Error Messages

- `"cidrBlock is required"`: VPC CIDR block must be specified
- `"availabilityZones must be provided and non-empty"`: At least one AZ required
- `"publicSubnetCidrs must be provided and match the number of availability zones"`: Subnet CIDRs must match AZ count
- `"VPC CIDR must be a valid CIDR block"`: Invalid CIDR format

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

MIT License - see LICENSE file for details. 