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
import {
  Row,
  Col,
  Layout,
  Descriptions,
  Card,
  Button,
  Avatar,
  Form,
  Modal,
  Input,
} from "antd";
import { PageHeader } from "@ant-design/pro-components";
import {
  PlusOutlined,
  OrderedListOutlined,
  ShoppingCartOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import {
  COUPON_CODE_REQUIRED,
  PRODUCT_DETAILS_REQUIRED,
  COUPON_AMOUNT_REQUIRED,
} from "../../constants/messages";
import { useNavigate } from "react-router-dom";
import roleTypes from "../../constants/roleTypes";

const { Content } = Layout;
const { Meta } = Card;

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string;
}

interface ShopProps extends PropsFromRedux {
  products: Product[];
  availableCredit: number;
  isCouponFormOpen: boolean;
  setIsCouponFormOpen: (isOpen: boolean) => void;
  hasErrored: boolean;
  errorMessage: string;
  onFinish: (values: any) => void;
  prevOffset: number | null;
  nextOffset: number | null;
  onOffsetChange: (offset: number | null) => void;
  onBuyProduct: (product: Product) => void;
  isNewProductFormOpen: boolean;
  setIsNewProductFormOpen: (isOpen: boolean) => void;
  newProductHasErrored: boolean;
  newProductErrorMessage: string;
  onNewProductFinish: (values: any) => void;
  isNewCouponFormOpen: boolean;
  setIsNewCouponFormOpen: (isOpen: boolean) => void;
  newCouponHasErrored: boolean;
  newCouponErrorMessage: string;
  onNewCouponFinish: (values: any) => void;
  role: string;
}

const ProductAvatar: React.FC<{ image_url: string }> = ({ image_url }) => (
  <Avatar
    shape="square"
    className="product-avatar"
    size={250}
    src={image_url}
  />
);

const ProductDescription: React.FC<{
  product: Product;
  onBuyProduct: (product: Product) => void;
}> = ({ product, onBuyProduct }) => (
  <div className="product-info">
    <div className="product-title">{product.name}</div>
    <div className="product-price">${Number(product.price).toFixed(2)}</div>
    <Button
      type="primary"
      shape="round"
      icon={<ShoppingCartOutlined />}
      size="large"
      key="buy-product"
      className="buy-btn"
      onClick={() => onBuyProduct(product)}
    >
      Buy
    </Button>
  </div>
);

const Shop: React.FC<ShopProps> = (props) => {
  const navigate = useNavigate();
  const {
    products,
    availableCredit,
    isCouponFormOpen,
    setIsCouponFormOpen,
    hasErrored,
    errorMessage,
    onFinish,
    prevOffset,
    nextOffset,
    onOffsetChange,
    onBuyProduct,
    isNewProductFormOpen,
    setIsNewProductFormOpen,
    newProductHasErrored,
    newProductErrorMessage,
    onNewProductFinish,
    isNewCouponFormOpen,
    setIsNewCouponFormOpen,
    newCouponHasErrored,
    newCouponErrorMessage,
    onNewCouponFinish,
    role,
  } = props;

  return (
    <Layout className="page-container">
      <PageHeader
        className="page-header"
        title="Shop"
        onBack={() => navigate("/dashboard")}
        extra={[
          role === roleTypes.ROLE_ADMIN && (
            <Button
              type="primary"
              shape="round"
              icon={<GiftOutlined />}
              size="large"
              key="new-coupon"
              onClick={() => setIsNewCouponFormOpen(true)}
            >
              Create Coupon
            </Button>
          ),
          <Button
            type="primary"
            shape="round"
            icon={<PlusOutlined />}
            size="large"
            key="add-coupons"
            onClick={() => setIsCouponFormOpen(true)}
          >
            Add Coupons
          </Button>,
          <Button
            type="primary"
            shape="round"
            icon={<OrderedListOutlined />}
            size="large"
            onClick={() => navigate("/past-orders")}
            key="past-orders"
          >
            Past Orders
          </Button>,
        ].filter(Boolean)}
      />
      <Descriptions column={1} className="balance-desc">
        <Descriptions.Item label="Available Balance">
          {`$${availableCredit}`}
        </Descriptions.Item>
      </Descriptions>
      <Content>
        <Row gutter={[30, 30]}>
          {products.map((product) => (
            <Col span={8} key={product.id}>
              <Card
                className="product-card"
                cover={<ProductAvatar image_url={product.image_url} />}
              >
                <Meta
                  description={
                    <ProductDescription
                      product={product}
                      onBuyProduct={onBuyProduct}
                    />
                  }
                />
              </Card>
            </Col>
          ))}
          {role === roleTypes.ROLE_ADMIN && (
            <Col span={8} key="new-product-card">
              <Card
                className="new-product-card"
                onClick={() => setIsNewProductFormOpen(true)}
                cover={<PlusOutlined className="add-icon" />}
              >
                <Meta
                  description={
                    <div className="product-info product-price">
                      Add Product
                    </div>
                  }
                />
              </Card>
            </Col>
          )}
        </Row>
        <Row justify="center" className="pagination">
          <Button
            type="primary"
            shape="round"
            size="large"
            onClick={() => onOffsetChange(prevOffset)}
            key="prev-button"
            disabled={prevOffset === null}
          >
            Previous
          </Button>
          <Button
            type="primary"
            shape="round"
            size="large"
            key="next-button"
            onClick={() => onOffsetChange(nextOffset)}
            disabled={!nextOffset}
          >
            Next
          </Button>
        </Row>
      </Content>
      <Modal
        title="Enter Coupon Code"
        open={isCouponFormOpen}
        footer={null}
        onCancel={() => setIsCouponFormOpen(false)}
      >
        <Form
          name="basic"
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
        >
          <Form.Item
            name="couponCode"
            rules={[{ required: true, message: COUPON_CODE_REQUIRED }]}
          >
            <Input placeholder="Coupon Code" />
          </Form.Item>
          <Form.Item>
            {hasErrored && <div className="error-message">{errorMessage}</div>}
            <Button type="primary" htmlType="submit" className="form-button">
              Validate
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Add New Product"
        open={isNewProductFormOpen}
        footer={null}
        onCancel={() => setIsNewProductFormOpen(false)}
      >
        <Form
          name="basic"
          initialValues={{
            remember: true,
          }}
          onFinish={onNewProductFinish}
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: PRODUCT_DETAILS_REQUIRED }]}
          >
            <Input placeholder="Product Name" />
          </Form.Item>
          <Form.Item
            name="price"
            rules={[
              { required: true, message: PRODUCT_DETAILS_REQUIRED },
              {
                pattern: /^\d+$/,
                message: "Please enter a valid price!",
              },
            ]}
          >
            <Input placeholder="Price" type="number" step="1" />
          </Form.Item>
          <Form.Item
            name="image_url"
            rules={[{ required: true, message: PRODUCT_DETAILS_REQUIRED }]}
          >
            <Input placeholder="Image URL (e.g., images/product.svg)" />
          </Form.Item>
          <Form.Item>
            {newProductHasErrored && (
              <div className="error-message">{newProductErrorMessage}</div>
            )}
            <Button type="primary" htmlType="submit" className="form-button">
              Add
            </Button>
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Create New Coupon"
        open={isNewCouponFormOpen}
        footer={null}
        onCancel={() => setIsNewCouponFormOpen(false)}
      >
        <Form
          name="basic"
          initialValues={{
            remember: true,
          }}
          onFinish={onNewCouponFinish}
        >
          <Form.Item
            name="couponCode"
            rules={[{ required: true, message: COUPON_CODE_REQUIRED }]}
          >
            <Input placeholder="Coupon Code" />
          </Form.Item>
          <Form.Item
            name="amount"
            rules={[
              { required: true, message: COUPON_AMOUNT_REQUIRED },
              {
                pattern: /^\d+$/,
                message: "Please enter a valid amount!",
              },
            ]}
          >
            <Input placeholder="Amount" type="number" step="1" />
          </Form.Item>
          <Form.Item>
            {newCouponHasErrored && (
              <div className="error-message">{newCouponErrorMessage}</div>
            )}
            <Button type="primary" htmlType="submit" className="form-button">
              Create
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

interface RootState {
  shopReducer: {
    accessToken: string;
    availableCredit: number;
    products: Product[];
    prevOffset: number | null;
    nextOffset: number | null;
  };
  userReducer: {
    role: string;
  };
}

const mapStateToProps = (state: RootState) => {
  const { accessToken, availableCredit, products, prevOffset, nextOffset } =
    state.shopReducer;
  const { role } = state.userReducer;
  return {
    accessToken,
    availableCredit,
    products,
    prevOffset,
    nextOffset,
    role,
  };
};

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(Shop);
