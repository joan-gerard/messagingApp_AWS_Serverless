import { formatJSONResponse } from '@libs/APIResponses';
import Dynamo from '@libs/Dynamo';
import { APIGatewayProxyEvent } from 'aws-lambda';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;

    // get user and groupId
    const { groupId } = event.pathParameters;
    console.log({ groupId });
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!groupId) {
      return formatJSONResponse({
        body: { message: 'missing group Id' },
        statusCode: 400,
      });
    }

    // check user is part of group
    const [userGroupConnection] = await Dynamo.query<UserGroupRecord>({
      tableName,
      index: 'index2',
      pkKey: 'pk2',
      pkValue: userId,
      skKey: 'sk2',
      skBeginsWith: `group#${groupId}`,
    });

    if (!userGroupConnection) {
      return formatJSONResponse({
        body: { message: 'you are not a member of this group' },
        statusCode: 401,
      });
    }

    // get the group details
    const [groupRecord, groupMembers] = await Promise.all([
      Dynamo.get<GroupRecord>({ pkValue: groupId, tableName }),
      Dynamo.query<UserGroupRecord>({
        tableName,
        index: 'index1',
        pkKey: 'pk',
        pkValue: groupId,
        skKey: 'sk',
        skBeginsWith: `user#`,
      }),
    ]);

    console.log({groupMembers})

    const groupResponse: GroupDetailsResponse = {
      ...groupRecord,
      members: groupMembers.map(({ userId, userName, family_name }) => ({
        userId,
        userName,
        family_name
      })),
    };

    // if user is group admin then get any join requests
    if (groupRecord.ownerId === userId) {
      const joinRequests = await Dynamo.query<JoinGroupRequestRecord>({
        tableName,
        index: 'index1',
        pkValue: groupId,
        skKey: 'sk',
        skBeginsWith: 'joinRequest#',
      });

      groupResponse.joinRequests = joinRequests.map(({ pk, sk, ...rest }) => rest);
    }

    return formatJSONResponse({
      body: groupResponse,
    });
  } catch (error) {
    console.log(error);
    return formatJSONResponse({
      body: {
        message: error.message,
      },
      statusCode: 500,
    });
  }
};
