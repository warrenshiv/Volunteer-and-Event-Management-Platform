import { v4 as uuidv4 } from "uuid";
import { Server, StableBTreeMap, Principal, None } from "azle";
import express from "express";

// Define the Volunteer class to represent volunteers
class Volunteer {
  id: string;
  name: string;
  email: string;
  contact: string;
  skills: string[];
  createdAt: Date;

  constructor(name: string, email: string, contact: string, skills: string[]) {
    this.id = uuidv4();
    this.name = name;
    this.email = email;
    this.contact = contact;
    this.skills = skills;
    this.createdAt = new Date();
  }
}

// Define the Event class to represent events
class Event {
  id: string;
  title: string;
  description: string;
  dateTime: Date;
  location: string;
  organizerId: string;
  createdAt: Date;

  constructor(title: string, description: string, dateTime: Date, location: string, organizerId: string) {
    this.id = uuidv4();
    this.title = title;
    this.description = description;
    this.dateTime = dateTime;
    this.location = location;
    this.organizerId = organizerId;
    this.createdAt = new Date();
  }
}

// Define the Registration class to represent event registrations
class Registration {
  id: string;
  eventId: string;
  volunteerId: string;
  status: string; // 'Registered', 'Attended', 'Missed'
  registeredAt: Date;
  attendedAt: Date | null;

  constructor(eventId: string, volunteerId: string, status: string) {
    this.id = uuidv4();
    this.eventId = eventId;
    this.volunteerId = volunteerId;
    this.status = status;
    this.registeredAt = new Date();
    this.attendedAt = null;
  }
}

// Define the Feedback class to represent feedback
class Feedback {
  id: string;
  volunteerId: string;
  eventId: string;
  feedback: string;
  rating: number; // e.g., 1-5 stars
  createdAt: Date;

  constructor(volunteerId: string, eventId: string, feedback: string, rating: number) {
    this.id = uuidv4();
    this.volunteerId = volunteerId;
    this.eventId = eventId;
    this.feedback = feedback;
    this.rating = rating;
    this.createdAt = new Date();
  }
}

// Initialize stable maps for storing platform data
const volunteersStorage = StableBTreeMap<string, Volunteer>(0);
const eventsStorage = StableBTreeMap<string, Event>(1);
const registrationsStorage = StableBTreeMap<string, Registration>(2);
const feedbacksStorage = StableBTreeMap<string, Feedback>(3);

// Define the express server
export default Server(() => {
  const app = express();
  app.use(express.json());

  // Endpoint for creating a new volunteer
  app.post("/volunteers", (req, res) => {
    if (
      !req.body.name ||
      typeof req.body.name !== "string" ||
      !req.body.email ||
      !req.body.contact ||
      typeof req.body.contact !== "string" ||
      !req.body.skills ||
      !Array.isArray(req.body.skills)
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure 'name', 'contact', 'email', and 'skills' are provided and are of the correct types.",
      });
      return;
    }

    // Validate the email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(req.body.email)) {
      res.status(400).json({
        Status: 400,
        error: "Invalid input: Ensure 'email' is a valid email address.",
      });
      return;
    }

    // Make sure the email is unique for each volunteer
    const existingVolunteers = volunteersStorage.values();
    const existingVolunteer = existingVolunteers.find(
      (volunteer) => volunteer.email === req.body.email
    );
    if (existingVolunteer) {
      res.status(400).json({
        Status: 400,
        error: "Invalid input: Volunteer with the same email already exists.",
      });
      return;
    }

    try {
      const volunteer = new Volunteer(
        req.body.name,
        req.body.email,
        req.body.contact,
        req.body.skills
      );
      volunteersStorage.insert(volunteer.id, volunteer);
      res.status(201).json({
        message: "Volunteer created successfully",
        volunteer: volunteer,
      });
    } catch (error) {
      console.error("Failed to create volunteer:", error);
      res.status(500).json({
        error: "Server error occurred while creating the volunteer.",
      });
    }
  });

  // Endpoint for retrieving a volunteer by ID
  app.get("/volunteers/:id", (req, res) => {
    const volunteerId = req.params.id;
    if (typeof volunteerId !== "string") {
      res.status(400).json({
        error: "Invalid input: Ensure 'id' is a string.",
      });
      return;
    }

    // Ckeck if the volunteer exists
    const volunteer = volunteersStorage.get(volunteerId);
    if (volunteer === None) {
      res.status(404).json({
        status: 404,
        error: "Volunteer with the provided ID does not exist.",
      });
      return;
    }

    try {
      res.status(200).json({
        message: "Volunteer retrieved successfully",
        volunteer: volunteer,
      });
    }
    catch (error) {
      console.error("Failed to retrieve volunteer:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving the volunteer.",
      });
    }
  });

  // Endpoint for retrieving all volunteers
  app.get("/volunteers", (req, res) => {
    try {
      const volunteers = volunteersStorage.values();
      res.status(200).json({
        message: "Volunteers retrieved successfully",
        volunteers: volunteers,
      });
    } catch (error) {
      console.error("Failed to retrieve volunteers:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving volunteers.",
      });
    }
  });

  // Endpoint for creating a new event
  app.post("/events", (req, res) => {
    if (
      !req.body.title ||
      typeof req.body.title !== "string" ||
      !req.body.description ||
      typeof req.body.description !== "string" ||
      !req.body.dateTime ||
      !req.body.location ||
      typeof req.body.location !== "string" ||
      !req.body.organizerId ||
      typeof req.body.organizerId !== "string"
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure 'title', 'description', 'dateTime', 'location', and 'organizerId' are provided and are of the correct types.",
      });
      return;
    }

    try {
      const event = new Event(
        req.body.title,
        req.body.description,
        new Date(req.body.dateTime),
        req.body.location,
        req.body.organizerId
      );
      eventsStorage.insert(event.id, event);
      res.status(201).json({
        message: "Event created successfully",
        event: event,
      });
    } catch (error) {
      console.error("Failed to create event:", error);
      res.status(500).json({
        error: "Server error occurred while creating the event.",
      });
    }
  });

  // Endpoint for retrieving all events
  app.get("/events", (req, res) => {
    try {
      const events = eventsStorage.values();
      res.status(200).json({
        message: "Events retrieved successfully",
        events: events,
      });
    } catch (error) {
      console.error("Failed to retrieve events:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving events.",
      });
    }
  });

  // Endpoint for creating a new registration
  app.post("/registrations", (req, res) => {
    if (
      !req.body.eventId ||
      typeof req.body.eventId !== "string" ||
      !req.body.volunteerId ||
      typeof req.body.volunteerId !== "string" ||
      !req.body.status ||
      typeof req.body.status !== "string"
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure 'eventId', 'volunteerId', and 'status' are provided and are of the correct types.",
      });
      return;
    }

    try {
      const registration = new Registration(
        req.body.eventId,
        req.body.volunteerId,
        req.body.status
      );
      registrationsStorage.insert(registration.id, registration);
      res.status(201).json({
        message: "Registration created successfully",
        registration: registration,
      });
    } catch (error) {
      console.error("Failed to create registration:", error);
      res.status(500).json({
        error: "Server error occurred while creating the registration.",
      });
    }
  });

  // Endpoint for retrieving all registrations
  app.get("/registrations", (req, res) => {
    try {
      const registrations = registrationsStorage.values();
      res.status(200).json({
        message: "Registrations retrieved successfully",
        registrations: registrations,
      });
    } catch (error) {
      console.error("Failed to retrieve registrations:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving registrations.",
      });
    }
  });

  // Endpoint for creating new feedback
  app.post("/feedbacks", (req, res) => {
    if (
      !req.body.volunteerId ||
      typeof req.body.volunteerId !== "string" ||
      !req.body.eventId ||
      typeof req.body.eventId !== "string" ||
      !req.body.feedback ||
      typeof req.body.feedback !== "string" ||
      !req.body.rating ||
      typeof req.body.rating !== "number"
    ) {
      res.status(400).json({
        error:
          "Invalid input: Ensure 'volunteerId', 'eventId', 'feedback', and 'rating' are provided and are of the correct types.",
      });
      return;
    }

    try {
      const feedback = new Feedback(
        req.body.volunteerId,
        req.body.eventId,
        req.body.feedback,
        req.body.rating
      );
      feedbacksStorage.insert(feedback.id, feedback);
      res.status(201).json({
        message: "Feedback created successfully",
        feedback: feedback,
      });
    } catch (error) {
      console.error("Failed to create feedback:", error);
      res.status(500).json({
        error: "Server error occurred while creating the feedback.",
      });
    }
  });

  // Endpoint for retrieving all feedback
  app.get("/feedbacks", (req, res) => {
    try {
      const feedbacks = feedbacksStorage.values();
      res.status(200).json({
        message: "Feedback retrieved successfully",
        feedbacks: feedbacks,
      });
    } catch (error) {
      console.error("Failed to retrieve feedback:", error);
      res.status(500).json({
        error: "Server error occurred while retrieving feedback.",
      });
    }
  });

  // Start the server
  return app.listen();
});
