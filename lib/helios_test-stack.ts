import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';

export class HeliosTestStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB tables
    const subjects = new dynamodb.Table(this, 'Subjects', {
      tableName: 'Subjects',
      partitionKey: { name: 'subjectId', type: dynamodb.AttributeType.STRING },
    });

    const kycInternal = new dynamodb.Table(this, 'KycInternal', {
      tableName: 'KycInternal',
      partitionKey: { name: 'kycId', type: dynamodb.AttributeType.STRING },
    });

    // Create Lambda function
    const updateStatusLambda = new lambda.Function(this, 'UpdateStatusLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = (event, context, callback) => {
            callback(null, "Hello World!");
        };
    `),
    });

    const testPipelineLambda = new lambda.Function(this, 'testPipelineLambda', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = (event, context, callback) => {
            callback(null, "Hello pipeline!");
        };
    `),
    });

    // Create Step Function states
    const getItemState = new tasks.DynamoGetItem(this, 'GetItem', {
      table: subjects,
      key: { subjectId: tasks.DynamoAttributeValue.fromString('12345678') },
    });

    const updateStatusState = new tasks.LambdaInvoke(this, 'UpdateStatus', {
      lambdaFunction: updateStatusLambda,
      //payload
    });

    const testPipelineState = new tasks.LambdaInvoke(this, 'testPipeline', {
      lambdaFunction: testPipelineLambda,
      //payload
    });

    const putItemState = new tasks.DynamoPutItem(this, 'PutItem', {
      table: kycInternal,
      item: {
        kycId: tasks.DynamoAttributeValue.fromString('1234567890'),
        name: tasks.DynamoAttributeValue.fromString('helios pipeline test name success'),
        status: tasks.DynamoAttributeValue.fromString('helios pipeline test status success'),
      },
    });

    // Create the state machine
    const stateMachine = new stepfunctions.StateMachine(this, 'MyNewStateMachine', {
      definitionBody: stepfunctions.DefinitionBody.fromChainable(
        getItemState
          .next(updateStatusState)
          .next(testPipelineState)
          .next(putItemState)
      )
    });

    //create pipeline
    const pipeline = new CodePipeline(this, 'pipeline', {
      pipelineName: 'testPipeline',
      synth: new ShellStep('synth', {
        input: CodePipelineSource.gitHub('Tasmia-Noor/Helios', 'main'),
        commands: ['npm ci',
          'npm run build',
          'npx cdk synth']
      })
    })
  }
}
