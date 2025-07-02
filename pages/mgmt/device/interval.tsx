import { NextPage } from "next";
import Layout from "../../../components/Layout";
import { useEffect, useState } from "react";


const Page: NextPage = () => {
  const [intervalSecs, setIntervalSecs] = useState(3600);

  useEffect(() => {
    return () => {}
  }, []);

  return (
    <Layout title={"전송 주기 설정"}>
      <></>
    </Layout>
  );
};

export default Page;