import React from "react";
import PropTypes from "prop-types";
import { Button, Form, Input } from "antd";
import { PHONE_NO_REQUIRED } from "../../constants/messages";
import { PHONE_VALIDATION } from "../../constants/constants";

const NewPhoneNumberForm = (props) => {
  const { onFinish, onPhoneNumberChange, hasErrored, errorMessage } = props;
  return (
    <Form
      name="phone_number"
      initialValues={{
        remember: true,
      }}
      onFinish={onFinish}
    >
      <Form.Item
        name="new_number"
        rules={[
          {
            required: true,
            message: PHONE_NO_REQUIRED,
          },
          {
            pattern: PHONE_VALIDATION,
            message: PHONE_NO_REQUIRED,
          },
        ]}
      >
        <Input
          className="input-style"
          placeholder="New Phone Number"
          onChange={(event) => onPhoneNumberChange(event.target.value)}
        />
      </Form.Item>
      <Form.Item>
        {hasErrored && <div className="error-message">{errorMessage}</div>}
        <Button type="primary" htmlType="submit" className="form-button">
          Send OTP for verification.
        </Button>
      </Form.Item>
    </Form>
  );
};

NewPhoneNumberForm.propTypes = {
  onFinish: PropTypes.func,
  hasErrored: PropTypes.bool,
  errorMessage: PropTypes.string,
  onPhoneNumberChange: PropTypes.func,
};

export default NewPhoneNumberForm;
