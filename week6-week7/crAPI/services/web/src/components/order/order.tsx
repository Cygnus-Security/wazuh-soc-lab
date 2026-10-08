/*
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "./styles.css";

import React from "react";
import { connect, ConnectedProps } from "react-redux";
import { Layout, Descriptions, Avatar, Row, Col, Card, Divider } from "antd";
import { formatDateFromIso } from "../../utils";
import { PageHeader } from "@ant-design/pro-components";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;

interface OrderProduct {
  name: string;
  price: number;
  image_url: string;
}

interface OrderUser {
  email: string;
  number: string;
}

interface OrderDetails {
  id: string;
  user: OrderUser;
  product: OrderProduct;
  created_on: string;
  quantity: number;
}

interface RootState {
  shopReducer: {
    order: OrderDetails;
  };
}

const mapStateToProps = (state: RootState) => ({
  order: state.shopReducer.order,
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

const Order: React.FC<PropsFromRedux> = ({ order }) => {
  const navigate = useNavigate();

  const renderAvatar = (url: string) => (
    <Avatar shape="square" className="order-avatar" size={200} src={url} />
  );

  return (
    <Layout className="page-container">
      <PageHeader
        title="Order Details"
        className="page-header"
        onBack={() => navigate("/past-orders")}
      />
      <Content>
        <Row>
          <Col className="order-desc" key={order?.id} span={6}>
            <Card
              className="order-card"
              cover={renderAvatar(order?.product.image_url)}
            />
          </Col>
          <Col className="order-desc" span={18}>
            <Descriptions bordered column={1} layout="horizontal">
              <Descriptions.Item label="Billed To">
                {order?.user.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {order?.user.number}
              </Descriptions.Item>
              <Descriptions.Item label="Item">
                {order?.product.name}
              </Descriptions.Item>
              <Descriptions.Item label="Purchased On">
                {order && formatDateFromIso(order.created_on)}
              </Descriptions.Item>
              <Descriptions.Item label="Unit Price">
                {order && `$ ${order.product.price}`}
              </Descriptions.Item>
              <Descriptions.Item label="Quantity">
                {order?.quantity}
              </Descriptions.Item>
              <Divider />
              <Descriptions.Item label="Total">
                {order && `$ ${order.quantity * order.product.price}`}
              </Descriptions.Item>
            </Descriptions>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default connector(Order);
