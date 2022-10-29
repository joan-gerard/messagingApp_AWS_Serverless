import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import * as Cognito from '@libs/Cognito';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { websocket } from '@libs/Websocket';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;
    const { connectionId, domainName, stage } = event.requestContext;

    //  get requesting user
    // const { userId } = await Cognito.verifyToken({ token });
    const { userId } = await Dynamo.get<UserConnectionRecord>({
      tableName,
      pkValue: connectionId,
    });

    // query groups
    const userGroups = await Dynamo.query<UserGroupRecord>({
      tableName,
      index: 'index2',
      pkKey: 'pk2',
      pkValue: userId,
      skKey: 'sk2',
      skBeginsWith: 'group#',
    });

    console.log({userGroups})

    // return groups
    const responseData = userGroups.map(({ groupId, groupName }) => ({
      groupId,
      groupName,
    }));

    console.log({responseData})


    await websocket.send({
      connectionId,
      domainName,
      stage,
      message: JSON.stringify({
        data: responseData,
        type: 'groupData'
      }),
    });


    return formatJSONResponse({
      body: {},
    });
  } catch (error) {
    console.log(error);
    return;
  }
};
