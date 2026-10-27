"use server";
import { revalidatePath } from "next/cache";
import { api } from "@/lib/api";

const refresh = () => { revalidatePath("/"); revalidatePath("/admin"); };
const send = async (path: string, body: object, method = "POST") => { await api(path, { method, body: JSON.stringify(body) }); refresh(); };
const s = (fd: FormData, k: string) => String(fd.get(k) || "").trim();

export const setStatus = async (fd: FormData) => send(`/statuses/${s(fd, "statusId")}`, { state: s(fd, "state"), excuse: s(fd, "excuse") }, "PATCH");
export const openCycle = async (fd: FormData) => send("/admin/cycles", { message: s(fd, "message") });
export const remind = async (fd: FormData) => send("/admin/remind", { message: s(fd, "message") });
export const addMember = async (fd: FormData) => send("/admin/members", { name: s(fd, "name"), phone: s(fd, "phone"), isAdmin: fd.get("isAdmin") === "on" });
export const assignJuz = async (fd: FormData) => send("/admin/assignments", { juz: parseInt(s(fd, "juz"), 10), memberId: s(fd, "memberId") });
