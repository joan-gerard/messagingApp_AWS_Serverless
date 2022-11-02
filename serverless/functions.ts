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

interface Authorizer {
  name: string;
  type: string;
  arn: {
    'Fn::GetAtt': string[];
  };
}
const authorizer: Authorizer = {
  name: 'authorizer',
  type: 'COGNITO_USER_POOLS',
  arn: { 'Fn::GetAtt': ['CognitoUserPool', 'Arn'] },
};

const functions: AWS['functions'] = {
  websocketConnect: {
    handler: 'src/functions/websocketConnect/index.handler',
    events: [
      {
        websocket: {
          route: '$connect',
        },
      },
    ],
  },
  websocketDisconnect: {
    handler: 'src/functions/websocketDisconnect/index.handler',
    events: [
      {
        websocket: {
          route: '$disconnect',
        },
      },
    ],
  },
  websocketCreateGroup: {
    handler: 'src/functions/websocketCreateGroup/index.handler',
    events: [
      {
        websocket: {
          route: 'createGroup',
        },
      },
    ],
  },
  websocketGetMyGroups: {
    handler: 'src/functions/websocketGetMyGroups/index.handler',
    events: [
      {
        websocket: {
          route: 'listMyGroups',
        },
      },
    ],
  },
  websocketMessage: {
    handler: 'src/functions/websocketMessage/index.handler',
    events: [
      {
        websocket: {
          route: 'message',
        },
      },
    ],
  },
  websocketJoinGroup: {
    handler: 'src/functions/websocketJoinGroup/index.handler',
    events: [
      {
        websocket: {
          route: 'joinGroup',
        },
      },
    ],
  },
  getGroupDetails: {
    handler: 'src/functions/getGroupDetails/index.handler',
    events: [
      {
        http: {
          method: 'get',
          path: 'group/{groupId}',
          authorizer,
          cors: true,
        },
      },
    ],
  },
  getMessageHistory: {
    handler: 'src/functions/getMessageHistory/index.handler',
    events: [
      {
        http: {
          method: 'get',
          path: 'messages/{groupId}',
          authorizer,
          cors: true,
        },
      },
    ],
  },
  websocketHandleJoinRequests: {
    handler: 'src/functions/websocketHandleJoinRequests/index.handler',
    events: [
      {
        websocket: {
          route: 'acceptJoinRequest',
        },
      },
      {
        websocket: {
          route: 'rejectJoinRequest',
        },
      },
    ],
  },
};

export default functions;
