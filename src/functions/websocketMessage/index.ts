import { formatJSONResponse } from '@libs/APIResponses';
import { APIGatewayProxyEvent } from 'aws-lambda';
import Dynamo from '@libs/Dynamo';
import { v4 as uuid } from 'uuid';

import { websocket } from '@libs/Websocket';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;

    const { connectionId, domainName, stage } = event.requestContext;

    // check there is a message and a group
    const { message, groupId } = JSON.parse(event.body);

    if (!message || !groupId) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: '"message" and "groupID" required',
          type: 'error',
        }),
      });
      return formatJSONResponse({
        body: {},
      });
    }
    // get the user
    const userConnection = await Dynamo.get<UserConnectionRecord>({
      pkValue: connectionId,
      tableName,
    });

    // check the user is part of group
    const [userGroupConnection] = await Dynamo.query<UserGroupRecord>({
      tableName,
      index: 'index2',
      pkKey: 'pk2',
      pkValue: userConnection.userId,
      skKey: 'sk2',
      skValue: `group#${groupId}`,
    });
    if (!userGroupConnection) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'You are not part of this group',
          type: 'error',
        }),
      });
      return formatJSONResponse({
        body: {},
      });
    }

    // save the message to dynamo
    const dateNow = Date.now();
    const data: MessageRecord = {
      id: uuid(),
      pk: groupId,
      sk: `message#${dateNow}`,
      groupId,
      from: userConnection.userName,
      fromId: userConnection.userId,
      message,
      date: dateNow,
    };

    await Dynamo.write({ data, tableName });

    // send message to all other users in group

    const wsClient = websocket.createClient({ domainName, stage });

    const groupUsers = await Dynamo.query<UserGroupRecord>({
      tableName,
      index: 'index1',
      pkKey: 'pk',
      pkValue: groupId,
      skKey: 'sk',
      skBeginsWith: 'user#',
    });

    const promiseArray = groupUsers
      .filter((user) => user.userId !== userConnection.userId)
      .map(async (user) => {
        const [destinationUserConnection] = await Dynamo.query<UserConnectionRecord>({
          pkValue: `connection#${user.userId}`,
          tableName,
          index: 'index1',
        });
        await websocket.send({
          connectionId: destinationUserConnection.id,
          wsClient,
          message: JSON.stringify({
            message,
            type: 'message',
            from: userConnection.userName,
            groupId,
            date: dateNow,
          }),
        });
      });

    await Promise.all(promiseArray);

    return formatJSONResponse({
      body: {},
    });
  } catch (error) {
    console.log(error);
    return;
  }
};
