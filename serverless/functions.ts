import { AWS } from '@serverless/typescript';

// const corsSettings = {
//   headers: [
//     // Specify allowed headers
//     'Content-Type',
//     'X-Amz-Date',
//     'Authorization',
//     'X-Api-Key',
//     'X-Amz-Security-Token',
//     'X-Amz-User-Agent',
//   ],
//   allowCredentials: false,
// };

// interface Authorizer {
//   name: string;
//   type: string;
//   arn: {
//     'Fn::GetAtt': string[];
//   };
// }
// const authorizer: Authorizer = {
//   name: 'authorizer',
//   type: 'COGNITO_USER_POOLS',
//   arn: { 'Fn::GetAtt': ['CognitoUserPool', 'Arn'] },
// };

const functions: AWS['functions'] = {
  websocketConnect: {
    handler: 'src/functions/websocketConnect/index.handler',
    events: [
      {
        websocket: {
          route: "$connect"
        },
      },
    ],
  },
};

export default functions;
