
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Readings from "../pages/Readings";
import { MemoryRouter } from "react-router-dom";

vi.mock("../api/axios", () => ({
    default: {
        get: vi.fn().mockResolvedValue({
            data: {
                readings: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    pages: 1,
                },
            },
        }),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

vi.mock("../components/Navbar", () => ({
    default: () => <nav>Navbar</nav>,
}));

describe("Readings page", () => {
    it("displays the glucose reading form", async () => {
        render(
            <MemoryRouter>
                <Readings />
            </MemoryRouter>
        );

        expect(
            screen.getByRole("heading", {
                name: /record new glucose reading/i,
            })
        ).toBeInTheDocument();

        expect(screen.getByLabelText(/reading date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/meal \/ time slot/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/glucose level/i)).toBeInTheDocument();
    });


    it("displays validation for an invalid glucose value", async () => {
        render(
            <MemoryRouter>
                <Readings />
            </MemoryRouter>
        );

        const valueInput = screen.getByLabelText(/glucose level/i);

        fireEvent.change(valueInput, {
            target: { value: "30" },
        });

        // Submit the form directly to test React's validation.
        fireEvent.submit(valueInput.closest("form"));

        expect(
            await screen.findByText(/between 40 and 600/i)
        ).toBeInTheDocument();
    });


    it("displays the empty readings message", async () => {
        render(
            <MemoryRouter>
                <Readings />
            </MemoryRouter>
        );

        expect(
            await screen.findByText(/no readings found/i)
        ).toBeInTheDocument();
    });
});
