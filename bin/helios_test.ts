#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { HeliosTestStack } from '../lib/helios_test-stack';

const app = new cdk.App();
new HeliosTestStack(app, 'HeliosTestStack', {
  env: { account: '307946680885', region: 'eu-west-1' },
});
app.synth();