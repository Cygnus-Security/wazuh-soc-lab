import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Icon, {
  CloseSquareOutlined,
  DeleteOutlined,
  ExpandAltOutlined,
  WechatWorkOutlined,
} from "@ant-design/icons";

const MarkdownMessage = (props: any) => {
  const message = props?.message;
  return (
    // Add avatar for bot
    <div className="chat-message">
      <div className="react-chatbot-kit-chat-bot-message ">
        <span>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message}</ReactMarkdown>
        </span>
        <div className="react-chatbot-kit-chat-bot-message-arrow"></div>
      </div>
    </div>
  );
};

export default MarkdownMessage;
