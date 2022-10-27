import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import { websocket } from '@libs/Websocket';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuid } from 'uuid';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;

    const { connectionId, domainName, stage } = event.requestContext;

    // get group name
    const { groupName } = JSON.parse(event.body);
    if (!groupName) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'you need to pass a group name with request',
          type: 'error',
        }),
      });
      return formatJSONResponse({
        body: {},
      });
    }

    // get user who makes the request
    const { userId, userName } = await Dynamo.get<UserConnectionRecord>({
      pkValue: connectionId,
      tableName,
    });

    // create group record
    const groupId = uuid().slice(0, 8);
    const groupData: GroupRecord = {
      id: groupId,
      ownerId: userId,
      groupName,
    };

    await Dynamo.write({ data: groupData, tableName });

    // create group user connection record
    createUserGroupConnection: {
      const data: UserGroupRecord = {
        id: uuid(),
        pk: groupId,
        sk: `user#${userId}`,
        pk2: userId,
        sk2: `group#${groupId}`,

        userId,
        groupId,
        userName,
        groupName,
      };
      await Dynamo.write({ data, tableName });
    }

    // send message that group was created

    await websocket.send({
      connectionId,
      domainName,
      stage,
      message: JSON.stringify({
        message: `you are now connected to group ${groupName}:${groupId}`,
        type: 'info',
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
