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

/* eslint-disable jsx-a11y/media-has-caption */
import "./profile.css";

import React, { useEffect, useRef } from "react";
import type { MenuProps } from "antd";
import { connect, ConnectedProps } from "react-redux";
import {
  Row,
  Col,
  Layout,
  Card,
  Button,
  Descriptions,
  Badge,
  Avatar,
  Dropdown,
  Modal,
  Form,
  Input,
} from "antd";
import { PageHeader } from "@ant-design/pro-components";
import {
  EditOutlined,
  CameraOutlined,
  UserOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import defaultProfilePic from "../../assets/default_profile_pic.png";
import {
  FAILURE_MESSAGE,
  PROFILE_PIC_UPDATED,
  SUCCESS_MESSAGE,
  VIDEO_NAME_CHANGED,
  VIDEO_NAME_REQUIRED,
  VIDEO_UPDATED,
} from "../../constants/messages";
import { useNavigate } from "react-router-dom";
import {
  changeVideoNameAction,
  convertVideoAction,
  getVideoAction,
  uploadProfilePicAction,
  uploadVideoAction,
} from "../../actions/profileActions";
import responseTypes from "../../constants/responseTypes";

const { Content } = Layout;
const { Meta } = Card;

interface UserData {
  name: string;
  email: string;
  number: string;
  accessToken: string;
}

interface ProfileData {
  profilePicData?: string;
  videoName?: string;
  videoId?: string;
  videoData?: string;
}

interface ProfileProps {
  profileData: ProfileData;
  userData: UserData;
}

type PropsFromRedux = ConnectedProps<typeof connector> & ProfileProps;

const Profile: React.FC<PropsFromRedux> = (props) => {
  const navigate = useNavigate();
  const [isVideoModalOpen, setIsVideoModalOpen] = React.useState(false);
  const [hasErrored, setHasErrored] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  const picInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [videoData, setVideoData] = React.useState<string | null>(null);

  const {
    userData,
    profileData,
    uploadProfilePic,
    uploadVideo,
    changeVideoName,
    convertVideo,
    getVideo,
  } = props;

  useEffect(() => {
    const callback = (res: string, data: any) => {
      if (res === responseTypes.SUCCESS) {
        setVideoData(data.profileVideo);
      } else {
        console.log("Error getting video", data);
      }
    };
    getVideo({
      accessToken: userData.accessToken,
      videoId: profileData.videoId,
      callback,
    });
  }, [userData.accessToken, profileData.videoId, getVideo]);

  const menuItems = () => {
    const items: Array<{
      label: string;
      key: string;
      icon: React.JSX.Element;
    }> = [];
    if (videoData) {
      items.push({
        label: "Change Video",
        key: "1",
        icon: <UserOutlined />,
      });
      items.push({
        label: "Change Video Name",
        key: "2",
        icon: <UserOutlined />,
      });
      items.push({
        label: "Share Video with Community",
        key: "3",
        icon: <UserOutlined />,
      });
    }
    return items;
  };

  const handleUploadProfilePic = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const callback = (res: string, data: any) => {
      if (res === responseTypes.SUCCESS) {
        Modal.success({
          title: SUCCESS_MESSAGE,
          content: PROFILE_PIC_UPDATED,
        });
      } else {
        Modal.error({
          title: FAILURE_MESSAGE,
          content: data,
        });
      }
    };
    uploadProfilePic({
      callback,
      accessToken: userData.accessToken,
      file: event.target.files?.[0],
    });
  };

  const handleUploadVideo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const callback = (res: string, data: any) => {
      if (res === responseTypes.SUCCESS) {
        Modal.success({
          title: SUCCESS_MESSAGE,
          content: VIDEO_UPDATED,
        });
      } else {
        Modal.error({
          title: FAILURE_MESSAGE,
          content: data,
        });
      }
    };
    uploadVideo({
      accessToken: userData.accessToken,
      callback,
      file: event.target.files?.[0],
    });
  };

  const handleChangeVideoName = (values: any) => {
    const callback = (res: string, data: any) => {
      if (res === responseTypes.SUCCESS) {
        setIsVideoModalOpen(false);
        Modal.success({
          title: SUCCESS_MESSAGE,
          content: VIDEO_NAME_CHANGED,
        });
        setVideoData(data.profileVideo);
      } else {
        setHasErrored(true);
        setErrorMessage(data);
      }
    };
    changeVideoName({
      accessToken: userData.accessToken,
      callback,
      videoId: profileData.videoId,
      ...values,
    });
  };

  const shareVideoWithCommunity = (videoId: string) => {
    const callback = (res: any, data: any) => {
      Modal.error({
        title: FAILURE_MESSAGE,
        content: data,
      });
    };
    convertVideo({ accessToken: userData.accessToken, videoId, callback });
  };

  const takeVideoAction: MenuProps["onClick"] = (e) => {
    console.log("Video Action", e);
    if (e.key === "1" && videoInputRef.current) videoInputRef.current.click();
    if (e.key === "2") setIsVideoModalOpen(true);
    if (e.key === "3") shareVideoWithCommunity(profileData.videoId || "");
  };

  const handleUploadVideoAction = () => {
    videoInputRef.current?.click();
  };

  const MenuProps = {
    onClick: takeVideoAction,
    items: menuItems(),
  };

  const renderChangePicButton = () => (
    <Button
      type="primary"
      shape="circle"
      icon={<CameraOutlined />}
      size="large"
      className="change-pic-btn"
      onClick={() => picInputRef.current?.click()}
    />
  );

  const renderProfileDescription = () => (
    <div className="profile-content">
      <Row gutter={[40, 40]} align="top">
        <Col xs={24} sm={24} md={8} lg={6}>
          <div className="profile-avatar-section">
            <Badge offset={[-10, 180]} count={renderChangePicButton()}>
              <input
                type="file"
                hidden
                ref={picInputRef}
                accept="image/*"
                onChange={handleUploadProfilePic}
              />
              <div className="avatar-container">
                <Avatar
                  size={200}
                  src={profileData.profilePicData || defaultProfilePic}
                  className="profile-avatar"
                />
              </div>
            </Badge>
          </div>
        </Col>
        <Col xs={24} sm={24} md={16} lg={18}>
          <div className="profile-info">
            <div className="info-item">
              <div className="info-label">Name</div>
              <div className="info-value">{userData.name}</div>
            </div>

            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value-with-action">
                <span className="info-value">{userData.email}</span>
                <Button
                  type="primary"
                  shape="round"
                  className="action-btn change-email-btn"
                  icon={<EditOutlined />}
                  onClick={() => navigate("/change-email")}
                >
                  Change email
                </Button>
              </div>
            </div>

            <div className="info-item">
              <div className="info-label">Phone Number</div>
              <div className="info-value-with-action">
                <span className="info-value">{userData.number}</span>
                <Button
                  type="primary"
                  shape="round"
                  className="action-btn change-phone-btn"
                  icon={<EditOutlined />}
                  onClick={() => navigate("/change-phone-number")}
                >
                  Change phone number
                </Button>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );

  const renderVideo = () => (
    <div className="video-container">
      <video controls className="profile-video" key={videoData || ""}>
        <source src={videoData || ""} type="video/mp4" />
      </video>
    </div>
  );

  return (
    <Layout className="page-container profile-page">
      <div className="profile-header-section">
        <h1 className="profile-title">Your Profile</h1>
        <p className="profile-subtitle">
          Manage your personal information and settings
        </p>
      </div>

      <Content className="profile-content-wrapper">
        <Card className="profile-card" hoverable>
          <Meta description={renderProfileDescription()} />
        </Card>

        <Card className="video-section-card" hoverable>
          <div className="video-header">
            <div className="video-info">
              <h2 className="video-title">My Personal Video</h2>
              <p className="video-subtitle">Max File Size: 10MB</p>
            </div>
            <div className="video-actions">
              {videoData ? (
                <Dropdown.Button
                  menu={MenuProps}
                  key="drop-down"
                  onClick={handleUploadVideoAction}
                  className="video-dropdown-btn"
                  type="primary"
                  size="large"
                >
                  <VideoCameraOutlined />
                  Manage Video
                </Dropdown.Button>
              ) : (
                <Button
                  type="primary"
                  shape="round"
                  icon={<VideoCameraOutlined />}
                  size="large"
                  className="upload-video-btn"
                  onClick={() => videoInputRef.current?.click()}
                >
                  Upload Video
                </Button>
              )}
            </div>
          </div>

          <input
            type="file"
            hidden
            ref={videoInputRef}
            accept="video/*"
            onChange={handleUploadVideo}
          />

          {videoData && (
            <div className="video-player-container">{renderVideo()}</div>
          )}
        </Card>
      </Content>
      <Modal
        title={<span className="modal-title">📹 Enter New Video Name</span>}
        open={isVideoModalOpen}
        footer={null}
        onCancel={() => setIsVideoModalOpen(false)}
        className="video-name-modal"
        centered
      >
        <Form
          name="video-name-form"
          layout="vertical"
          initialValues={{
            remember: true,
          }}
          onFinish={handleChangeVideoName}
          className="video-name-form"
        >
          <Form.Item
            name="videoName"
            label="Video Name"
            initialValue={profileData.videoName}
            rules={[{ required: true, message: VIDEO_NAME_REQUIRED }]}
          >
            <Input
              placeholder="Enter your video name..."
              className="video-name-input"
              size="large"
            />
          </Form.Item>
          <Form.Item className="form-actions">
            {hasErrored && <div className="error-message">{errorMessage}</div>}
            <div className="modal-buttons">
              <Button
                onClick={() => setIsVideoModalOpen(false)}
                className="cancel-btn"
                size="large"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                className="submit-btn"
                size="large"
                icon={<VideoCameraOutlined />}
              >
                Update Name
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

const mapDispatchToProps = {
  uploadProfilePic: uploadProfilePicAction,
  uploadVideo: uploadVideoAction,
  changeVideoName: changeVideoNameAction,
  convertVideo: convertVideoAction,
  getVideo: getVideoAction,
};

const mapStateToProps = ({
  userReducer,
  profileReducer,
}: {
  userReducer: UserData;
  profileReducer: ProfileData;
}) => {
  return { userData: userReducer, profileData: profileReducer };
};

const connector = connect(mapStateToProps, mapDispatchToProps);

export default connector(Profile);
