import { gql, useQuery } from '@apollo/client';

import { useHasMounted } from '../lib/hooks/useHasMounted';

const QUERY = gql`
  query USERS {
    users {
      id
      email
    }
  }
`;
export default function Home() {
  const { data, loading, error } = useQuery(QUERY);

  const hasMounted = useHasMounted();
  if (!hasMounted) {
    return null;
  }

  if (loading) {
    return <h2>Loading...</h2>;
  }

  if (error) {
    console.error(error);
    return null;
  }
  return (
    <div>
      {data.users.map(({ id, email }: { id: string; email: string }) => (
        <div key={id}>
          <h3>{id}</h3>
          <p>
            {id} - {email}
          </p>
        </div>
      ))}
    </div>
  );
}
