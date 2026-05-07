import React from 'react';

import TeamOrange from './TeamOrange';
import TeamYellow from './TeamYellow';

export interface TeamMember {
  name: string;
  email: string;
  picture: string;
  team: 'Orange' | 'Yellow';
}

const members: TeamMember[] = [
  // Orange Team
  {
    name: 'Miggiani, Abigail',
    email: 'abbymiggiani2026@u.northwestern.edu',
    picture:
      'https://ui-avatars.com/api/?name=Abigail+Miggiani&background=E65100&color=fff',
    team: 'Orange',
  },
  {
    name: 'Ma, Fay',
    email: 'fayma2029@u.northwestern.edu',
    picture: 'https://ui-avatars.com/api/?name=Fay+Ma&background=E65100&color=fff',
    team: 'Orange',
  },
  {
    name: 'Press, Jack',
    email: 'jackpress2027@u.northwestern.edu',
    picture: 'https://ui-avatars.com/api/?name=Jack+Press&background=E65100&color=fff',
    team: 'Orange',
  },
  {
    name: 'Turinumugisha, Souvenir',
    email: 'souvenirturinumugisha2028@u.northwestern.edu',
    picture:
      'https://ui-avatars.com/api/?name=Souvenir+Turinumugisha&background=E65100&color=fff',
    team: 'Orange',
  },
  {
    name: 'Iyer, Damini',
    email: 'daminiiyer2026@u.northwestern.edu',
    picture: 'https://ui-avatars.com/api/?name=Damini+Iyer&background=E65100&color=fff',
    team: 'Orange',
  },
  // Yellow Team
  {
    name: 'Wu, Andy',
    email: 'andywu2025@u.northwestern.edu',
    picture: 'https://ui-avatars.com/api/?name=Andy+Wu&background=F9A825&color=000',
    team: 'Yellow',
  },
  {
    name: 'Wu, Jefferson',
    email: 'jeffersonwu2027@u.northwestern.edu',
    picture: 'https://ui-avatars.com/api/?name=Jefferson+Wu&background=F9A825&color=000',
    team: 'Yellow',
  },
  {
    name: 'Hir, Stanley',
    email: 'stanleyhir2027@u.northwestern.edu',
    picture: 'https://ui-avatars.com/api/?name=Stanley+Hir&background=F9A825&color=000',
    team: 'Yellow',
  },
  {
    name: 'Huang, Yimin',
    email: 'yiminhuang2028@u.northwestern.edu',
    picture: 'https://ui-avatars.com/api/?name=Yimin+Huang&background=F9A825&color=000',
    team: 'Yellow',
  },
  {
    name: 'Hsieh, Gabriel P.',
    email: 'gabrielhsieh2026@u.northwestern.edu',
    picture: 'https://ui-avatars.com/api/?name=Gabriel+Hsieh&background=F9A825&color=000',
    team: 'Yellow',
  },
];

const TeamFrame: React.FC = () => {
  const orangeMembers = members.filter((m) => m.team === 'Orange');
  const yellowMembers = members.filter((m) => m.team === 'Yellow');
  return (
    <div style={{ display: 'flex', gap: 32 }}>
      <TeamOrange members={orangeMembers} />
      <TeamYellow members={yellowMembers} />
    </div>
  );
};

export default TeamFrame;
