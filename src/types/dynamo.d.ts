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

interface MessageRecord {
  id: string;
  pk: string; // groupId
  sk: string; // message#${date}

  groupId: string;
  from: string;
  fromId: string;
  message: string;
  date: number;
}

interface JoinGroupRequestRecord {
  id: string;
  pk: string; // groupId
  sk: string; // joinRequest#${userId}

  userId: string;
  groupId: string;
  userName: string;
}
