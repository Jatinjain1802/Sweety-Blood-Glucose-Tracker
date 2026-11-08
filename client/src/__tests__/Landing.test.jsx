import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Landing from "../pages/Landing";

/**
 * 🎓 Vitest & React Testing Library Concepts:
 * 1. MemoryRouter: Simulates browser routing in headless test environments (jsdom).
 * 2. Testing Authenticated vs Unauthenticated States: By manipulating localStorage
 *    before rendering, we verify our conditional logic works accurately for both
 *    first-time guests and returning signed-in users!
 */
describe("Landing Page Component", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    it("renders brand name, main hero heading, and primary CTAs for new visitors", () => {
        render(
            <MemoryRouter>
                <Landing />
            </MemoryRouter>
        );

        // Verify brand is displayed
        expect(screen.getAllByText("Sweety")[0]).toBeInTheDocument();

        // Verify main hero heading
        expect(
            screen.getByRole("heading", {
                name: /understand your numbers\.\s*take charge of your health\./i,
            })
        ).toBeInTheDocument();

        // Verify public guest navigation links
        expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /get started/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /start tracking free/i })).toBeInTheDocument();
    });

    it("displays all three core feature cards and step-by-step guidance", () => {
        render(
            <MemoryRouter>
                <Landing />
            </MemoryRouter>
        );

        // Check features
        expect(screen.getByText(/easy daily tracking/i)).toBeInTheDocument();
        expect(screen.getByText(/clear visual trends/i)).toBeInTheDocument();
        expect(screen.getByText(/useful summaries/i)).toBeInTheDocument();

        // Check how it works steps
        expect(screen.getByText(/create your account/i)).toBeInTheDocument();
        expect(screen.getByText(/record your readings/i)).toBeInTheDocument();
        expect(screen.getByText(/review your progress/i)).toBeInTheDocument();
    });

    it("adaptively updates navigation to direct user to Dashboard if already logged in", () => {
        // Set mock user session in localStorage
        localStorage.setItem("token", "mock-jwt-token");
        localStorage.setItem("user", JSON.stringify({ name: "Alex" }));

        render(
            <MemoryRouter>
                <Landing />
            </MemoryRouter>
        );

        // When logged in, public "Log in" link is replaced with dashboard CTA
        expect(screen.queryByRole("link", { name: /^log in$/i })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: /dashboard \(alex\)/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /open your dashboard/i })).toBeInTheDocument();
    });
});

