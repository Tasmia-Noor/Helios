import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as HeliosTest from '../lib/helios_test-stack';


const app = new cdk.App();
const stack = new HeliosTest.HeliosTestStack(app, 'MyTestStack');

const template = Template.fromStack(stack);

test('Lambda Test', () => {

    template.hasResourceProperties("AWS::Lambda::Function", {
        Handler: 'index.handler',
        Runtime: "nodejs18.x",
    });
});


test('Step Function Definition Test', () => {

    template.hasResource('AWS::StepFunctions::StateMachine',
        {
        });
});