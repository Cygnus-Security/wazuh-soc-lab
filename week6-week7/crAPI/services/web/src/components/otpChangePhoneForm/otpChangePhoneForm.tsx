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
import { Button, Form, Input } from "antd";
import { OTP_REQUIRED } from "../../constants/messages";

interface OTPChangePhoneFormProps {
  onFinish: (values: any) => void;
  errorMessage: string;
  hasErrored: boolean;
}

const OTPChangePhoneForm: React.FC<OTPChangePhoneFormProps> = ({
  onFinish,
  errorMessage,
  hasErrored,
}) => {
  return (
    <Form
      name="password"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        name="otp"
        rules={[
          {
            required: true,
            message: OTP_REQUIRED,
          },
        ]}
      >
        <Input className="input-style" placeholder="OTP" />
      </Form.Item>
      <Form.Item>
        {hasErrored && <div className="error-message">{errorMessage}</div>}
        <Button type="primary" htmlType="submit" className="form-button">
          Set Phone Number
        </Button>
      </Form.Item>
    </Form>
  );
};

export default OTPChangePhoneForm;
