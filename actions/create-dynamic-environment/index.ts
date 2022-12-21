import { getInput, setFailed } from "@actions/core";
import { HttpClient } from "@actions/http-client";

type DynamicEnvironments = {
  Id: string;
  Name: string;
};

type DynamicEnvironmentsResponse = {
  Items: Array<DynamicEnvironments>;
};

async function createDynamicEnvironment() {
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

  if (environments.statusCode !== 200) {
    throw new Error(
      `Failed to get dynamic environments. Status: ${
        environments.statusCode
      }, Response: ${
        environments.result ? JSON.stringify(environments.result) : ""
      }`
    );
  }

  if (
    !environments.result?.Items.find((environment) => environment.Name === name)
  ) {
    const createEnvironmentUrl = `${server}/api/spaces/${space}/environments/dynamic/create/v1`;

    const response = await httpClient.postJson(createEnvironmentUrl, {
      name: name,
    });

    if (response.statusCode !== 200) {
      throw new Error(
        `Failed to create dynamic environment. Status: ${
          response.statusCode
        }, Response: ${response.result ? JSON.stringify(response.result) : ""}`
      );
    }
  }
}

createDynamicEnvironment().catch((reason) => {
  setFailed(reason);
});
