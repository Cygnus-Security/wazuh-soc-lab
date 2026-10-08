/*
 *
 * Licensed under the Apache License, Version 2.0 (the “License”);
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an “AS IS” BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect } from "react";

import PropTypes from "prop-types";
import { connect } from "react-redux";
import { Modal } from "antd";
import {
  getProductsAction,
  buyProductAction,
  applyCouponAction,
  newProductAction,
  newCouponAction,
} from "../../actions/shopActions";
import Shop from "../../components/shop/shop";
import { useNavigate } from "react-router-dom";
import responseTypes from "../../constants/responseTypes";
import { FAILURE_MESSAGE, SUCCESS_MESSAGE } from "../../constants/messages";

const ShopContainer = (props) => {
  const { accessToken, getProducts, buyProduct } = props;
  const navigate = useNavigate();

  const [hasErrored, setHasErrored] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isCouponFormOpen, setIsCouponFormOpen] = useState(false);

  const [isNewProductFormOpen, setIsNewProductFormOpen] = useState(false);
  const [newProductHasErrored, setNewProductHasErrored] = useState(false);
  const [newProductErrorMessage, setNewProductErrorMessage] = useState("");

  const [newCouponHasErrored, setNewCouponHasErrored] = React.useState(false);
  const [newCouponErrorMessage, setNewCouponErrorMessage] = React.useState("");
  const [isNewCouponFormOpen, setIsNewCouponFormOpen] = useState(false);

  useEffect(() => {
    const callback = (res, data) => {
      if (res !== responseTypes.SUCCESS) {
        Modal.error({
          title: FAILURE_MESSAGE,
          content: data,
        });
      }
    };
    getProducts({ callback, accessToken });
  }, [accessToken, getProducts]);

  const handleBuyProduct = (product) => {
    const callback = (res, data) => {
      if (res === responseTypes.SUCCESS) {
        Modal.success({
          title: SUCCESS_MESSAGE,
          content: data,
          onOk: () => navigate("/past-orders"),
        });
      } else {
        Modal.error({
          title: FAILURE_MESSAGE,
          content: data,
        });
      }
    };
    buyProduct({ callback, accessToken, productId: product.id });
  };

  const handleOffsetChange = (offset) => {
    const callback = (res, data) => {
      if (res !== responseTypes.SUCCESS) {
        Modal.error({
          title: FAILURE_MESSAGE,
          content: data,
        });
      }
    };
    getProducts({ callback, accessToken, offset });
  };

  const handleFormFinish = (values) => {
    const callback = (res, data) => {
      if (res === responseTypes.SUCCESS) {
        setIsCouponFormOpen(false);
        Modal.success({
          title: SUCCESS_MESSAGE,
          content: data,
        });
      } else {
        setHasErrored(true);
        setErrorMessage(data);
      }
    };
    props.applyCoupon({
      callback,
      accessToken,
      ...values,
    });
  };

  const handleNewProductFormFinish = (values) => {
    const callback = (res, data) => {
      if (res === responseTypes.SUCCESS) {
        setIsNewProductFormOpen(false);
        Modal.success({
          title: SUCCESS_MESSAGE,
          content: data,
          onOk: () => handleOffsetChange(0),
        });
      } else {
        setNewProductHasErrored(true);
        setNewProductErrorMessage(data);
      }
    };
    props.newProduct({
      callback,
      accessToken,
      ...values,
    });
  };

  const handleNewCouponFormFinish = (values) => {
    const callback = (res, data) => {
      if (res === responseTypes.SUCCESS) {
        setIsNewCouponFormOpen(false);
        Modal.success({
          title: SUCCESS_MESSAGE,
          content: data,
        });
      } else {
        setNewCouponHasErrored(true);
        setNewCouponErrorMessage(data);
      }
    };
    props.newCoupon({
      callback,
      accessToken,
      ...values,
    });
  };

  return (
    <Shop
      onBuyProduct={handleBuyProduct}
      isCouponFormOpen={isCouponFormOpen}
      setIsCouponFormOpen={setIsCouponFormOpen}
      hasErrored={hasErrored}
      errorMessage={errorMessage}
      onFinish={handleFormFinish}
      onOffsetChange={handleOffsetChange}
      isNewProductFormOpen={isNewProductFormOpen}
      setIsNewProductFormOpen={setIsNewProductFormOpen}
      newProductHasErrored={newProductHasErrored}
      newProductErrorMessage={newProductErrorMessage}
      onNewProductFinish={handleNewProductFormFinish}
      isNewCouponFormOpen={isNewCouponFormOpen}
      setIsNewCouponFormOpen={setIsNewCouponFormOpen}
      newCouponHasErrored={newCouponHasErrored}
      newCouponErrorMessage={newCouponErrorMessage}
      onNewCouponFinish={handleNewCouponFormFinish}
      {...props}
    />
  );
};

const mapStateToProps = ({
  userReducer: { accessToken, prevOffset, nextOffset },
}) => {
  return { accessToken, prevOffset, nextOffset };
};

const mapDispatchToProps = {
  getProducts: getProductsAction,
  buyProduct: buyProductAction,
  applyCoupon: applyCouponAction,
  newProduct: newProductAction,
  newCoupon: newCouponAction,
};

ShopContainer.propTypes = {
  accessToken: PropTypes.string,
  getProducts: PropTypes.func,
  buyProduct: PropTypes.func,
  applyCoupon: PropTypes.func,
  newProduct: PropTypes.func,
  newCoupon: PropTypes.func,
  nextOffset: PropTypes.number,
  prevOffset: PropTypes.number,
  onOffsetChange: PropTypes.func,
};

export default connect(mapStateToProps, mapDispatchToProps)(ShopContainer);
