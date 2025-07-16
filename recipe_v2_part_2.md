The project contains an MCP server that uses STDIN STDOUT, which can be used with apps like Claude Desktop. 

I want to run production on the cloud.

# Tasks 

- Convert the app to optionally run as as a remote mcp server when in production.

- Authentication is not required

- Create a Dockerfile to build the app and run the remote server, which will eventually be deployed to Fly.io

# References

- Here's a guide from cloudflare: https://developers.cloudflare.com/agents/guides/remote-mcp-server/

- Here's an authless remote server: https://github.com/cloudflare/ai/tree/main/demos/remote-mcp-authless
