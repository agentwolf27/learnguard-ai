export const ltiScopes = {
  nrpsRosterReadonly: "https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly",
  agsLineItem: "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
  agsLineItemReadonly: "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem.readonly",
  agsScore: "https://purl.imsglobal.org/spec/lti-ags/scope/score",
  agsResultReadonly: "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
  deepLinking: "https://purl.imsglobal.org/spec/lti-dl/scope/deeplinking"
};

export type NrpsMember = {
  user_id: string;
  name?: string;
  email?: string;
  roles?: string[];
  status?: string;
};

export async function fetchNrpsRoster({
  membershipUrl,
  accessToken
}: {
  membershipUrl: string;
  accessToken: string;
}) {
  const response = await fetch(membershipUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.ims.lti-nrps.v2.membershipcontainer+json"
    }
  });

  if (!response.ok) {
    throw new Error(`NRPS roster sync failed with ${response.status}`);
  }

  return (await response.json()) as { members: NrpsMember[] };
}

export async function createAgsLineItem({
  lineItemsUrl,
  accessToken,
  label,
  scoreMaximum,
  resourceId
}: {
  lineItemsUrl: string;
  accessToken: string;
  label: string;
  scoreMaximum: number;
  resourceId: string;
}) {
  const response = await fetch(lineItemsUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/vnd.ims.lis.v2.lineitem+json"
    },
    body: JSON.stringify({
      scoreMaximum,
      label,
      resourceId,
      tag: "learnguard-ai"
    })
  });

  if (!response.ok) {
    throw new Error(`AGS line item creation failed with ${response.status}`);
  }

  return response.json();
}
