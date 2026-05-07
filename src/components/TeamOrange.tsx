import React from 'react';

import { TeamMember } from './TeamFrame';

const TEAM_COLOR = '#E65100';

interface Props {
  members: TeamMember[];
}

const TeamOrange: React.FC<Props> = ({ members }) => (
  <section
    style={{
      background: TEAM_COLOR,
      color: '#fff',
      borderRadius: 12,
      padding: 24,
      minWidth: 320,
    }}
  >
    <h2>Orange Team</h2>
    <ul style={{ listStyle: 'none', padding: 0 }}>
      {members.map((m) => (
        <li
          key={m.email}
          style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}
        >
          <img
            src={m.picture}
            alt={m.name}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              marginRight: 16,
              border: '2px solid #fff',
            }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{m.name}</div>
            <a
              href={`mailto:${m.email}`}
              style={{ color: '#fff', textDecoration: 'underline' }}
            >
              {m.email}
            </a>
          </div>
        </li>
      ))}
    </ul>
  </section>
);

export default TeamOrange;
