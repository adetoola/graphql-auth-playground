import { gql, useQuery } from '@apollo/client';
import { useHasMounted } from '../lib/hooks/useHasMounted';

const AUTHUSER_QUERY = gql`
query ME {
    me{
    id
    email
    }
}
`;

const Me = () => {
    const { data, loading, error } = useQuery(AUTHUSER_QUERY);
    console.log({data})
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

  return <div>
    id: {data.user.id}
    email: { data.user.email}
  </div>
};

export default Me;