import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";

/**
 * 🎓 React & Vitest Concepts Explained:
 *
 * 1. Simulating Interactive Flows (Open -> Cancel -> Reopen -> Confirm):
 *    We test the entire user decision loop:
 *    - Click "Logout" -> Modal appears
 *    - Click "Cancel" -> Modal disappears, session remains intact
 *    - Click "Logout" again -> Modal reappears
 *    - Click "Yes, Log Out" -> Storage cleared & redirected to "/"
 *
 * 2. Testing Keyboard Events:
 *    - `fireEvent.keyDown(window, { key: "Escape" })` tests our `useEffect` listener.
 */

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe("Navbar Component with Logout Confirmation Modal", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem("token", "dummy-session-token");
        localStorage.setItem("user", JSON.stringify({ name: "Sweety User" }));
    });

    it("opens confirmation modal when clicking logout, and allows cancelling", () => {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        const logoutButton = screen.getByRole("button", { name: /logout/i });

        // Ensure modal is not visible initially
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

        // 1. Click logout to trigger modal
        fireEvent.click(logoutButton);

        // Modal should now be in the document
        expect(screen.getByRole("dialog")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /log out of sweety\?/i })).toBeInTheDocument();

        // 2. Click Cancel
        const cancelButton = screen.getByRole("button", { name: /cancel/i });
        fireEvent.click(cancelButton);

        // Modal should be closed, session must be preserved
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(localStorage.getItem("token")).toBe("dummy-session-token");
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it("closes modal on Escape key press", () => {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        const logoutButton = screen.getByRole("button", { name: /logout/i });
        fireEvent.click(logoutButton);
        expect(screen.getByRole("dialog")).toBeInTheDocument();

        // Press Escape
        fireEvent.keyDown(window, { key: "Escape" });
        expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
        expect(localStorage.getItem("token")).toBe("dummy-session-token");
    });

    it("clears localStorage and navigates to '/' when confirming logout", () => {
        render(
            <MemoryRouter>
                <Navbar />
            </MemoryRouter>
        );

        // Open modal
        fireEvent.click(screen.getByRole("button", { name: /logout/i }));

        // Click "Yes, Log Out"
        const confirmButton = screen.getByRole("button", { name: /yes, log out/i });
        fireEvent.click(confirmButton);

        // Verify session cleared
        expect(localStorage.getItem("token")).toBeNull();
        expect(localStorage.getItem("user")).toBeNull();

        // Verify redirect to landing page
        expect(mockNavigate).toHaveBeenCalledWith("/");
    });
});
