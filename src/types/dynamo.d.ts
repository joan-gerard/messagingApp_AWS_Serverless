interface UserConnectionRecord {
  id: string;
  pk: string;
  sk: string;

  userName: string;
  userId: string;
  domainName: string;
  stage: string;
}

interface GroupRecord {
  id: string;
  ownerId: string;
  groupName: string;
}

interface UserGroupRecord {
  id: string;
  pk: string; // grouped by groupId
  sk: string; // user#{userId}
  pk2: string; // grouped by userID
  sk2: string; // group#{groupId}

  userId: string;
  groupId: string;
  userName: string;
  groupName: string;
}
