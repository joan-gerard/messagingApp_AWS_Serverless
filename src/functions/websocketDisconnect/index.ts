import { formatJSONResponse } from '@libs/APIResponses';
import { APIGatewayProxyEvent } from 'aws-lambda';
import Dynamo from '@libs/Dynamo';

export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    const tableName = process.env.singleTable;

    const { connectionId } = event.requestContext;

    await Dynamo.delete({ pkKey: 'id', pkValue: connectionId, tableName });

    return formatJSONResponse({
      body: {},
    });
  } catch (error) {
    console.log(error);
    return;
  }
};
