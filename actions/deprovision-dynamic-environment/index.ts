import { getInput, setFailed, info } from "@actions/core";
import { HttpClient } from "@actions/http-client";

type DynamicEnvironment = {
  Id: string;
  Name: string;
};

type DynamicEnvironmentsResponse = {
  Environments: {
    Items: Array<DynamicEnvironment>;
  };
};

async function deprovisionDynamicEnvironment() {
  const server = getInput("server");
  const apiKey = getInput("api_key");
  const space = getInput("space");
  const name = getInput("environment_name");

  const getEnvironmentsUrl = `${server}/api/spaces/${space}/environments/dynamic/v1`;
  const httpClient = new HttpClient();
  const environments = await httpClient.getJson<DynamicEnvironmentsResponse>(
    getEnvironmentsUrl,
    {
      "X-Octopus-ApiKey": apiKey,
    }
  );

  info(JSON.stringify(environments));

  if (environments.statusCode !== 200) {
    throw new Error(
      `Failed to get dynamic environments. Status: ${
        environments.statusCode
      }, Response: ${
        environments.result ? JSON.stringify(environments.result) : ""
      }`
    );
  }

  const environment = environments.result?.Environments.Items.find(
    (environment) => environment.Name === name
  );

  if (environment) {
    const deprovisionEnvironmentUrl = `${server}/api/spaces/${space}/environments/${environment.Id}/deprovision/all/v1`;

    const response = await httpClient.postJson(
      deprovisionEnvironmentUrl,
      {},
      {
        "X-Octopus-ApiKey": apiKey,
      }
    );

    if (response.statusCode !== 200) {
      throw new Error(
        `Failed to deprovision dynamic environment. Status: ${
          response.statusCode
        }, Response: ${response.result ? JSON.stringify(response.result) : ""}`
      );
    }
  }
}

deprovisionDynamicEnvironment().catch((reason) => {
  setFailed(reason);
});
