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

import "./login.css";

import { Button, Form, Input, Card } from "antd";
import React from "react";

import { UserOutlined } from "@ant-design/icons";
import { EMAIL_VALIDATION } from "../../constants/constants";
import { EMAIL_REQUIRED } from "../../constants/messages";
import { useNavigate } from "react-router-dom";

/**
 * Login component for users
 */
interface LoginProps {
  hasErrored?: boolean;
  errorMessage?: string;
  onFinish: (values: any) => void;
}

const Login: React.FC<LoginProps> = ({
  hasErrored = false,
  errorMessage = "",
  onFinish,
}) => {
  const navigate = useNavigate();
  const handleForgotPasswordClick = () => {
    navigate("/forgot-password");
  };
  const handleSignUpClick = () => {
    navigate("/signup");
  };
  return (
    <div className="container">
      <Card title="Login" bordered={false} className="form-card">
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
            <Input placeholder="Email" prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[
              {
                required: true,
                message: "Please input your password!",
              },
            ]}
          >
            <Input.Password placeholder="Password" />
          </Form.Item>
          <Form.Item>
            <div className="form-actions">
              <button
                className="alternative-style"
                onClick={handleForgotPasswordClick}
                type="button"
              >
                Forgot Password?
              </button>
              {hasErrored && (
                <div className="error-message">{errorMessage}</div>
              )}
              <Button type="primary" htmlType="submit" className="form-button">
                Login
              </Button>
              <button
                className="alternative-style"
                onClick={handleSignUpClick}
                type="button"
              >
                Don't have an Account? SignUp
              </button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
