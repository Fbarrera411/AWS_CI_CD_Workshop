import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecsPatterns from 'aws-cdk-lib/aws-ecs-patterns';

// import * as sqs from 'aws-cdk-lib/aws-sqs';

interface ConsumerProps extends StackProps {
  ecrRepository: ecr.Repository;
}

export class AppCdkStack extends cdk.Stack {

    public readonly repository: ecr.Repository;
    public readonly fargateService: ecsPatterns.ApplicationLoadBalancedFargateService;

    constructor(scope: Construct, id: string, props: ConsumerProps) {
      super(scope, `${id}-app-stack`, props);
      
      //  this.repository = new ecr.Repository(this, 'my_app');
      const vpc = new ec2.Vpc(this, `${id}-Vpc`);
      const cluster = new ecs.Cluster(this, `${id}-EcsCluster`, {
        vpc: vpc
      });

      this.fargateService = new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        `${id}-FargateService`,
        {
          cluster: cluster,
          publicLoadBalancer: true,
          memoryLimitMiB: 1024,
          cpu: 512,
          desiredCount: 1,
          taskImageOptions: {
            image: ecs.ContainerImage.fromEcrRepository(props.ecrRepository),
            containerName: 'my-app',
            containerPort: 8081,
          },
        }
      );

      this.fargateService.targetGroup.configureHealthCheck({
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
        timeout: Duration.seconds(10),
        interval:Duration.seconds(11),
        path: "/my-app",
      });
  
      this.fargateService.targetGroup.setAttribute(
        'deregistration_delay.timeout_seconds',
        '5',
      );

    }
}
