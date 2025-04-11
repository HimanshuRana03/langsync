import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "@/styles/auth.module.css";
import Link from "next/link";
export default function Register() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify({ name, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (res.ok) {
      router.push("/login");
    } else {
      const data = await res.json();
      alert(data.message || "Registration failed");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Register</h2>
      <form onSubmit={handleRegister} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit" className={styles.button}>
          Register
        </button>
        <div className={styles.link}>
          <span className={styles.inside}>
            Already have an account? <Link href="/login">Login</Link>
          </span>
        </div>
      </form>
    </div>
  );
}
