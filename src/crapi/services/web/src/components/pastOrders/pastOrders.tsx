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
import { Row, Col, Layout, Card, Button, Avatar } from "antd";
import { PageHeader } from "@ant-design/pro-components";
import { RollbackOutlined } from "@ant-design/icons";
import { connect, ConnectedProps } from "react-redux";
import { formatDateFromIso } from "../../utils";
import { useNavigate } from "react-router-dom";

const { Content } = Layout;
const { Meta } = Card;

interface Order {
  id: string;
  product: {
    name: string;
    price: number;
    image_url: string;
  };
  quantity: number;
  created_on: string;
  status: string;
}

interface RootState {
  shopReducer: {
    pastOrders: Order[];
    prevOffset: number | null;
    nextOffset: number | null;
  };
}

const mapStateToProps = (state: RootState) => ({
  pastOrders: state.shopReducer.pastOrders,
  prevOffset: state.shopReducer.prevOffset,
  nextOffset: state.shopReducer.nextOffset,
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface PastOrdersProps extends PropsFromRedux {
  returnOrder: (id: string) => void;
  handleOffsetChange: (offset: number | null) => void;
}

const PastOrders: React.FC<PastOrdersProps> = (props) => {
  const navigate = useNavigate();
  const { pastOrders } = props;

  const renderAvatar = (url: string) => (
    <Avatar shape="square" className="order-avatar" size={220} src={url} />
  );

  const renderOrderDescription = (order: Order) => (
    <div className="order-info">
      <div className="order-product-name">{order.product.name}</div>
      <div className="order-price">
        ${(Number(order.product.price) * order.quantity).toFixed(2)}
      </div>
      <div className="order-date">{formatDateFromIso(order.created_on)}</div>
      <div className="order-actions">
        <Button
          type="primary"
          shape="round"
          size="middle"
          key="order-details"
          onClick={() => navigate(`/orders?order_id=${order.id}`)}
        >
          Order Details
        </Button>
        <Button
          type="primary"
          shape="round"
          icon={order.status === "delivered" && <RollbackOutlined />}
          size="middle"
          key="return-order"
          disabled={order.status !== "delivered"}
          onClick={() => props.returnOrder(order.id)}
        >
          {order.status === "delivered" ? "Return" : order.status}
        </Button>
      </div>
    </div>
  );

  return (
    <Layout className="page-container">
      <PageHeader
        title="Past Orders"
        className="page-header"
        onBack={() => navigate("/shop")}
      />
      <Content>
        <Row gutter={[32, 32]}>
          {pastOrders.map((order) => (
            <Col xs={24} sm={12} lg={8} key={order && order.id}>
              <Card
                className="order-card"
                cover={renderAvatar(order && order.product.image_url)}
                hoverable
              >
                <Meta description={renderOrderDescription(order)} />
              </Card>
            </Col>
          ))}
        </Row>
        <Row justify="center" className="pagination">
          <Col>
            <Button
              type="primary"
              shape="round"
              size="large"
              onClick={() => props.handleOffsetChange(props.prevOffset)}
              key="prev-button"
              disabled={props.prevOffset === null}
            >
              ← Previous
            </Button>
          </Col>
          <Col>
            <Button
              type="primary"
              shape="round"
              size="large"
              onClick={() => props.handleOffsetChange(props.nextOffset)}
              key="next-button"
              disabled={props.nextOffset === null}
            >
              Next →
            </Button>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default connector(PastOrders);
