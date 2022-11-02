import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import { websocket } from '@libs/Websocket';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { v4 as uuid } from 'uuid';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;

    const { connectionId, domainName, stage } = event.requestContext;

    // get details from request
    const { groupId, requestId, userId, action } = JSON.parse(event.body);
    if (!groupId || !requestId || !userId || !action) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'groupId, requestId, userId, action are required on the body',
          type: 'err',
        }),
      });
      return;
    }

    // get: groupRequest, getAdminConnection, group, userGroupConnection
    const groupRecordPromise = Dynamo.get<GroupRecord>({
      tableName,
      pkValue: groupId,
    });
    const adminConnectionPromise = Dynamo.get<UserConnectionRecord>({
      tableName,
      pkValue: connectionId,
    });

    const joinGroupRequestPromise = Dynamo.get<JoinGroupRequestRecord>({
      tableName,
      pkValue: requestId,
    });
    const userGroupConnectionsPromise = Dynamo.query<UserGroupRecord>({
      tableName,
      index: 'index2',
      pkKey: 'pk2',
      pkValue: userId,
      skKey: 'sk2',
      skBeginsWith: `group#${groupId}`,
    });

    const [groupRecord, adminConnection, joinGroupRequest, userGroupConnections] =
      await Promise.all([
        groupRecordPromise,
        adminConnectionPromise,
        joinGroupRequestPromise,
        userGroupConnectionsPromise,
      ]);

    if (groupRecord.ownerId !== adminConnection.userId) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'you are not the owner of this group',
          type: 'err',
        }),
      });
      return;
    }

    if (!joinGroupRequest) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'joinGroupRequest not found',
          type: 'err',
        }),
      });
      return;
    }

    // if the action === reject, then we delete request
    if (action === 'rejectJoinRequest') {
      await Dynamo.delete({
        tableName,
        pkValue: requestId,
      });
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'request has been rejected',
          type: 'info',
        }),
      });
      return;
    }

    // if action === accept, then we add user to group, then delete request

    if (userGroupConnections.length !== 0) {
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'user is already part of the group',
          type: 'err',
        }),
      });
      await Dynamo.delete({
        tableName,
        pkValue: requestId,
      });

      return;
    }
    createUserGroupConnection: {
      const data: UserGroupRecord = {
        id: uuid(),
        pk: groupId,
        sk: `user#${userId}`,
        pk2: userId,
        sk2: `group#${groupId}`,

        userId,
        groupId,
        userName: joinGroupRequest.userName,
        groupName: groupRecord.groupName,
      };
      await Dynamo.write({ data, tableName });
      await Dynamo.delete({
        tableName,
        pkValue: requestId,
      });
      await websocket.send({
        connectionId,
        domainName,
        stage,
        message: JSON.stringify({
          message: 'user added to the group',
          type: 'info',
        }),
      });
    }

    return formatJSONResponse({
      body: {},
    });
  } catch (error) {
    console.log(error);
    return;
  }
};
