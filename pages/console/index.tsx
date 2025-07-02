import type { NextPage } from 'next'
import Layout from '../../components/AdminLayout'
import Login from '../../components/Login'
import { useSession } from '../../lib/useSession'
import { Grid } from '@mui/material';
import EquipmentCard from '../../components/EquipmentCard'
import { useDeviceList } from '../../lib/useAPI'

const Home: NextPage = () => {
  const session = useSession();
  const {devices} = useDeviceList()

  if (!session.isLoaded) {
    return <></>;
  }

  return (
    <Layout layoutType={'view'}>
      {!session.isLoggedIn ? (
        <Login title={'STL 통합 관리'} />
      ) : (
        <Grid container spacing={2}>
          {devices && devices.map(({equipment_type, id}) => (
            <Grid item xs={12} key={`${equipment_type}-${id}`}>
              <EquipmentCard id={`${equipment_type}${id}`} />
            </Grid>
          ))}
        </Grid>
      )}
    </Layout>
  )
}

export default Home
