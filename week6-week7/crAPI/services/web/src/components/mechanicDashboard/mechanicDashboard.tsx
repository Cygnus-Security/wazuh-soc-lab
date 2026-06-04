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
import { Card, Row, Col, Layout } from "antd";
import { PageHeader } from "@ant-design/pro-components";

const { Meta } = Card;

interface Owner {
  email: string;
  number: string;
}

interface Vehicle {
  owner: Owner;
  id: string;
  vin: string;
}

interface Service {
  id: string;
  problem_details: string;
  created_on: string;
  updated_on: string;
  vehicle: Vehicle;
  status: string;
}

interface MechanicDashboardProps {
  services: Service[];
}

const MechanicDashboard: React.FC<MechanicDashboardProps> = ({ services }) => {
  return (
    <Layout className="page-container">
      <PageHeader title="Pending Services" />
      <Row gutter={[16, 24]}>
        {services.map((service) => (
          <Col span={8} key={service.id}>
            <Card hoverable className="dashboard-card">
              <Meta title={service.id} description={service.created_on} />
              <p>
                Problem Details:
                {service.problem_details}
              </p>
              <p>
                Vehicle VIN:
                {service.vehicle.vin}
              </p>
              <p>
                Owner email-id:
                {service.vehicle.owner.email}
              </p>
              <p>
                Owner Phone No.:
                {service.vehicle.owner.number}
              </p>
              <p>
                Status:
                {service.status}
              </p>
              <p>
                Updated On:
                {service.updated_on}
              </p>
              <p>
                <a href={`/mechanic-service?id=${service.id}`}>View Service</a>
              </p>
            </Card>
          </Col>
        ))}
      </Row>
    </Layout>
  );
};

export default MechanicDashboard;
