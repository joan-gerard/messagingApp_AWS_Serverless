import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import { websocket } from '@libs/Websocket';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuid } from 'uuid';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;

    const { connectionId, domainName, stage } = event.requestContext;

    const { groupId } = JSON.parse(event.body);

    if (!groupId) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'please pass up groupId',
          type: 'err',
        }),
      });
      return;
    }

    // get the user
    const userConnection = await Dynamo.get<UserConnectionRecord>({
      tableName,
      pkValue: connectionId,
    });

    // check the group exists
    const group = await Dynamo.get<GroupRecord>({
      tableName,
      pkValue: groupId,
    });

    if (!group) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'Invalid Group ID',
          type: 'err',
        }),
      });
      return;
    }
    // check that they are not already a member
    const [userGroupConnection] = await Dynamo.query<UserGroupRecord>({
      tableName,
      index: 'index2',
      pkKey: 'pk2',
      pkValue: userConnection.userId,
      skKey: 'sk2',
      skBeginsWith: `group#${groupId}`,
    });

    if (userGroupConnection) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'You are already part of this group',
          type: 'err',
        }),
      });
      return;
    }
    
    // add "join group" request
    const data: JoinGroupRequestRecord = {
      id: uuid(),
      pk: groupId,
      sk: `joinRequest#${userConnection.userId}`,

      userId: userConnection.userId,
      groupId,
      userName: userConnection.userName,
      family_name: userConnection.family_name
    };

    console.log({data})

    await Dynamo.write({ data, tableName });

    await websocket.send({
      connectionId,
      domainName,
      stage,
      message: JSON.stringify({
        message: 'group request created. The Group Admin needs to appove request',
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
