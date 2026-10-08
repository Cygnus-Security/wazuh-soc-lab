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

import React from "react";

import { connect, ConnectedProps } from "react-redux";
import { Button, Form, Card, Input, Select, Typography, Layout } from "antd";
import {
  CarOutlined,
  ToolOutlined,
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import {
  VIN_REQUIRED,
  MECHANIC_REQUIRED,
  PROBLEM_REQUIRED,
} from "../../constants/messages";
import "./styles.css";

const { Option } = Select;
const { Title, Text } = Typography;

interface Mechanic {
  mechanic_code: string;
}

interface RootState {
  vehicleReducer: {
    mechanics: Mechanic[];
  };
}

interface ContactMechanicProps extends PropsFromRedux {
  onFinish: (values: any) => void;
  hasErrored: boolean;
  errorMessage: string;
}

const ContactMechanic: React.FC<ContactMechanicProps> = ({
  mechanics,
  hasErrored,
  errorMessage,
  onFinish,
}) => {
  const urlParams = new URLSearchParams(window.location.search);
  const VIN = urlParams.get("VIN");

  return (
    <Layout className="page-container contact-mechanic-page">
      <div className="contact-mechanic-container">
        <div className="page-title">
          <Title level={1}>
            <ToolOutlined style={{ color: "#8b5cf6", marginRight: "12px" }} />
            Contact Mechanic
          </Title>
          <Text>
            Submit a service request for your vehicle and get connected with a
            qualified mechanic
          </Text>
        </div>

        <Card
          className="contact-mechanic-card"
          title={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <UserOutlined style={{ color: "#8b5cf6", fontSize: "24px" }} />
              <span>Service Request Form</span>
            </div>
          }
          bordered={false}
        >
          <Form
            name="contact-mechanic-form"
            className="contact-mechanic-form"
            layout="vertical"
            initialValues={{
              vin: VIN,
            }}
            onFinish={onFinish}
            size="large"
          >
            {/* Vehicle Information Section */}
            <div className="vehicle-info-section">
              <div className="form-section-title">
                <CarOutlined style={{ color: "#3b82f6" }} />
                Vehicle Information
              </div>

              <Form.Item
                name="vin"
                label={
                  <span>
                    <CarOutlined
                      style={{ marginRight: "8px", color: "#8b5cf6" }}
                    />
                    Vehicle Identification Number (VIN)
                  </span>
                }
                rules={[{ required: true, message: VIN_REQUIRED }]}
              >
                <Input
                  placeholder="Enter your vehicle VIN"
                  disabled
                  prefix={<CarOutlined style={{ color: "#6b7280" }} />}
                />
              </Form.Item>
            </div>

            {/* Mechanic Selection Section */}
            <div className="mechanic-selection-section">
              <div className="form-section-title">
                <ToolOutlined style={{ color: "#10b981" }} />
                Select Mechanic
              </div>

              <Form.Item
                name="mechanicCode"
                label={
                  <span>
                    <ToolOutlined
                      style={{ marginRight: "8px", color: "#8b5cf6" }}
                    />
                    Available Mechanics
                  </span>
                }
                rules={[{ required: true, message: MECHANIC_REQUIRED }]}
              >
                <Select
                  placeholder="Choose a mechanic for your service"
                  showSearch
                  optionFilterProp="children"
                  filterOption={(input, option) =>
                    (option?.children as unknown as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                >
                  {mechanics.map((mechanic) => (
                    <Option
                      value={mechanic.mechanic_code}
                      key={mechanic.mechanic_code}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <ToolOutlined style={{ color: "#8b5cf6" }} />
                        {mechanic.mechanic_code}
                      </div>
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {/* Problem Description Section */}
            <div className="problem-description-section">
              <div className="form-section-title">
                <MessageOutlined style={{ color: "#f59e0b" }} />
                Problem Description
              </div>

              <Form.Item
                name="problemDetails"
                label={
                  <span>
                    <MessageOutlined
                      style={{ marginRight: "8px", color: "#8b5cf6" }}
                    />
                    Describe the Issue
                  </span>
                }
                rules={[{ required: true, message: PROBLEM_REQUIRED }]}
              >
                <Input.TextArea
                  placeholder="Please provide a detailed description of the problem you're experiencing with your vehicle..."
                  rows={6}
                  showCount
                  maxLength={1000}
                />
              </Form.Item>
            </div>

            {/* Error Message */}
            {hasErrored && (
              <div className="error-message">
                <ExclamationCircleOutlined />
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="submit-service-request-btn"
                icon={<SendOutlined />}
              >
                Send Service Request
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </Layout>
  );
};

const mapStateToProps = (state: RootState) => ({
  mechanics: state.vehicleReducer.mechanics,
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(ContactMechanic);
