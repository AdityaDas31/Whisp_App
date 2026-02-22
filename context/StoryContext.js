import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";
import { API_BASE_URL } from "../config";

const StoryContext = createContext();

export const StoryProvider = ({ children }) => {

  const { token } = useAuth();

  const API = `${API_BASE_URL}/story`;

  const [myStories, setMyStories] = useState([]);
  const [visibleStories, setVisibleStories] = useState([]);
  const [loading, setLoading] = useState(false);



//  ADD STORY (TEXT OR MEDIA)

  const addStory = async ({
    type = "media",
    mediaFiles = [],
    caption = "",
    textStyle = {},
    privacy = "public"
  }) => {

    try {

      setLoading(true);

      const formData = new FormData();

      if (type === "text") {

        formData.append("format", "text");

        formData.append("caption", caption);

        formData.append(
          "textStyle",
          JSON.stringify({
            backgroundColor: textStyle.backgroundColor,
            textColor: textStyle.textColor,
            font: textStyle.font || "default"
          })
        );

      }
      else {

        mediaFiles.forEach((media, index) => {

          formData.append("media", {
            uri: media.uri,
            type:
              media.type === "video"
                ? "video/mp4"
                : "image/jpeg",
            name:
              media.type === "video"
                ? `story_${index}.mp4`
                : `story_${index}.jpg`,
          });

        });

        formData.append("caption", caption);

      }

      formData.append("privacy", privacy);

      const res = await axios.post(
        `${API}/add-story`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      );

      await fetchMyStories();
      await fetchVisibleStories();

      return res.data;

    }
    catch (error) {

      console.log("Add story error:", error.response?.data || error.message);

      throw error.response?.data;

    }
    finally {

      setLoading(false);

    }

  };

//  GET MY STORIES

  const fetchMyStories = async () => {

    try {

      const res = await axios.get(
        `${API}/view-my-story`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setMyStories(res.data);

    }
    catch (error) {

      console.log("Fetch my stories error:", error.response?.data);

    }

  };


//  GET VISIBLE STORIES

  const fetchVisibleStories = async () => {

    try {

      const res = await axios.get(
        `${API}/view-story`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setVisibleStories(res.data.stories);

    }
    catch (error) {

      console.log("Fetch visible stories error:", error.response?.data);

    }

  };



// MARK STORY AS VIEWED

  const viewStory = async (storyId) => {

    try {

      await axios.post(
        `${API}/view/${storyId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

    }
    catch (error) {

      console.log("View story error:", error.response?.data);

    }

  };


//  DELETE STORY

  const deleteStory = async (storyId) => {

    try {

      await axios.delete(
        `${API}/delete-story/${storyId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      await fetchMyStories();
      await fetchVisibleStories();

    }
    catch (error) {

      console.log("Delete story error:", error.response?.data);

    }

  };


  return (
    <StoryContext.Provider
      value={{
        loading,
        myStories,
        visibleStories,
        addStory,
        fetchMyStories,
        fetchVisibleStories,
        viewStory,
        deleteStory
      }}
    >
      {children}
    </StoryContext.Provider>
  );

};


export const useStory = () => useContext(StoryContext);
