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

import React, { useEffect, useState } from "react";
import {
  Card,
  Row,
  Col,
  Descriptions,
  Spin,
  Layout,
  Timeline,
  Input,
  Button,
  Form,
  Select,
  Modal,
  Space,
} from "antd";
import { PageHeader } from "@ant-design/pro-components";
import { Content } from "antd/es/layout/layout";
import { connect, ConnectedProps } from "react-redux";
import responseTypes from "../../constants/responseTypes";
import { RootState } from "../../reducers/rootReducer";
import {
  createCommentAction,
  updateServiceRequestStatusAction,
} from "../../actions/mechanicActions";
import { getMechanicServiceAction } from "../../actions/userActions";
import { FAILURE_MESSAGE } from "../../constants/messages";

interface Owner {
  email: string;
  number: string;
}

interface Vehicle {
  owner: Owner;
  id: string;
  vin: string;
}

interface Mechanic {
  mechanic_code: string;
  user: Owner;
}

interface Comment {
  comment: string;
  created_on: string;
}

interface Service {
  id: string;
  problem_details: string;
  created_on: string;
  vehicle: Vehicle;
  status: string;
  mechanic: Mechanic;
  comments: Comment[];
}

interface MechanicServiceRequestProps {
  serviceId: string;
}

type PropsFromRedux = ConnectedProps<typeof connector> &
  MechanicServiceRequestProps;

const MechanicServiceRequest: React.FC<PropsFromRedux> = (props) => {
  const {
    accessToken,
    serviceId,
    getService,
    createComment,
    updateServiceRequestStatus,
  } = props;

  const [service, setService] = useState<Service>();

  useEffect(() => {
    const callback = (res: string, data: Service) => {
      if (res === responseTypes.SUCCESS) {
        console.log("Data", data);
        console.log("res", res);
        setService(data as Service);
      } else {
        Modal.error({
          title: FAILURE_MESSAGE,
          content: "Failed to fetch service request",
        });
      }
    };
    getService({ accessToken, serviceId, callback });
  }, [accessToken, serviceId, getService]);

  const [form] = Form.useForm();
  function handleAddComment(): void {
    const comment = form.getFieldValue("comment");
    console.log("Comment", comment);
    createComment({
      accessToken: accessToken || "",
      serviceId: service?.id || "",
      comment: comment,
      callback: (status: any, data?: Comment) => {
        if (status === responseTypes.SUCCESS && data) {
          if (service) {
            setService({
              ...service,
              comments: [data, ...(service?.comments || [])],
            });
            form.resetFields(["comment"]);
          }
        } else {
          Modal.error({
            title: "Error",
            content: "Error adding comment",
          });
        }
      },
    });
  }

  function handleStatusChange(value: string): void {
    console.log("Status changed to", value);
    updateServiceRequestStatus({
      accessToken: accessToken || "",
      serviceId: service?.id || "",
      status: value,
      callback: (status: any, data?: any) => {
        if (status === responseTypes.SUCCESS && data) {
          setService(data as Service);
        }
      },
    });
  }

  if (!service) {
    console.log("Service is undefined");
    return (
      <Content>
        <Spin
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
          }}
        />
      </Content>
    );
  }

  console.log("Comments ", service?.comments);

  return (
    <Layout className="page-container">
      <PageHeader
        title={`Service Report: ${service.vehicle.vin} ${service.status}`}
        subTitle={service.created_on}
        className="service-report-header"
        style={{ width: "80%", margin: "auto" }}
      />
      <Card
        className="service-report-card"
        style={{ margin: "auto", width: "80%" }}
      >
        <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
          <Col>
            <Card title="Report Details" className="info-card">
              <Descriptions column={2}>
                <Descriptions.Item label="Report ID">
                  {service.id}
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Select
                    size="small"
                    style={{ width: 120 }}
                    defaultValue={service.status}
                    onChange={handleStatusChange}
                    options={[
                      { value: "completed", label: <span>Completed</span> },
                      { value: "inprogress", label: <span>In Progress</span> },
                      { value: "pending", label: <span>Pending</span> },
                      { value: "cancelled", label: <span>Cancelled</span> },
                    ]}
                  />
                </Descriptions.Item>
              </Descriptions>
              <Descriptions column={1}>
                <Descriptions.Item label="Created On">
                  {service.created_on}
                </Descriptions.Item>
                <Descriptions.Item
                  label="Problem Details"
                  style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
                >
                  {service.problem_details}
                </Descriptions.Item>
              </Descriptions>
            </Card>
            <Card
              title="Service Comments"
              className="info-card"
              style={{ marginTop: "16px", marginBottom: "16px" }}
            >
              <Form
                form={form}
                onFinish={handleAddComment}
                layout="inline"
                style={{ margin: "16px" }}
              >
                <Form.Item
                  name="comment"
                  rules={[
                    { required: true, message: "Please input your comment!" },
                  ]}
                >
                  <Input.TextArea
                    name="comment"
                    rows={2}
                    cols={50}
                    placeholder="Add a comment"
                  ></Input.TextArea>
                </Form.Item>
                <Form.Item>
                  {" "}
                  <Button type="primary" htmlType="submit">
                    Submit Comment
                  </Button>
                </Form.Item>
                <Space></Space>
              </Form>
              <Timeline
                items={service?.comments.map((comment, index) => ({
                  label: comment.created_on,
                  children: comment.comment,
                  color: index === 0 ? "green" : "gray",
                }))}
              />
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
          <Col>
            <Card title="Assigned Mechanic" className="info-card">
              <Descriptions column={1}>
                <Descriptions.Item label="Mechanic Code">
                  {service.mechanic.mechanic_code}
                </Descriptions.Item>
                <Descriptions.Item label="Mechanic Email">
                  {service.mechanic.user.email}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
          <Col>
            <Card title="Vehicle Information" className="info-card">
              <Descriptions column={1}>
                <Descriptions.Item label="VIN">
                  {service.vehicle.vin}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: "16px" }}>
          <Col>
            <Card title="Owner Information" className="info-card">
              <Descriptions column={1}>
                <Descriptions.Item label="Email">
                  {service.vehicle.owner.email}
                </Descriptions.Item>
                <Descriptions.Item label="Phone">
                  {service.vehicle.owner.number}
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      </Card>
    </Layout>
  );
};

const mapStateToProps = (state: RootState) => ({
  accessToken: state.userReducer.accessToken,
});

const mapDispatchToProps = {
  getService: getMechanicServiceAction,
  createComment: createCommentAction,
  updateServiceRequestStatus: updateServiceRequestStatusAction,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(MechanicServiceRequest);
