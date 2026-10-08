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

import "./unlock.css";

import { Button, Form, Input, Card } from "antd";
import React from "react";
import { useNavigate } from "react-router-dom";
import { UserOutlined } from "@ant-design/icons";
import { EMAIL_VALIDATION } from "../../constants/constants";
import { EMAIL_REQUIRED } from "../../constants/messages";

interface UnlockProps {
  email?: string;
  message?: string;
  hasErrored?: boolean;
  errorMessage?: string;
  onFinish: (values: any) => void;
}

/**
 * unlock component for users
 */
const Unlock: React.FC<UnlockProps> = ({
  email,
  message,
  hasErrored = false,
  errorMessage = "",
  onFinish,
}) => {
  const navigate = useNavigate();

  return (
    <div className="container">
      <Card title="Unlock Account" bordered={false} className="form-card">
        <Form
          name="basic"
          initialValues={{
            remember: true,
          }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: EMAIL_REQUIRED },
              {
                pattern: EMAIL_VALIDATION,
                message: EMAIL_REQUIRED,
              },
            ]}
          >
            <Input
              placeholder="Email"
              prefix={<UserOutlined />}
              value={email}
            />
          </Form.Item>
          <Form.Item
            name="code"
            rules={[
              {
                required: true,
                message: "Please input your code received on email!",
              },
            ]}
          >
            <Input.Password placeholder="Code" />
          </Form.Item>
          <Form.Item>
            {hasErrored && <div className="error-message">{errorMessage}</div>}
            {message && <div className="error-message">{message}</div>}
            <Button type="primary" htmlType="submit" className="form-button">
              Unlock
            </Button>
          </Form.Item>
          <Form.Item>
            <button
              className="alternative-style"
              onClick={() => navigate("/login")}
              type="button"
            >
              {" "}
              Already Unlocked? Login
            </button>
          </Form.Item>
          <Form.Item>
            <button
              className="alternative-style"
              onClick={() => navigate("/signup")}
              type="button"
            >
              {" "}
              Dont have an Account? SignUp
            </button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Unlock;
