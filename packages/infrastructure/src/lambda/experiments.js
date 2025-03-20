// Simple Lambda handler for experiments endpoint
exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  // Return a simple response for now
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
    },
    body: JSON.stringify({
      message: 'Experiments endpoint handler',
      path: event.path,
      method: event.httpMethod,
      queryStringParameters: event.queryStringParameters || {},
      pathParameters: event.pathParameters || {}
    })
  };
};