import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "@/styles/auth.module.css";
import Link from "next/link";
export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await signIn("credentials", {
      redirect: false,
      name,
      password,
    });

    if (res.ok) {
      router.push("/");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Login</h2>
      <form onSubmit={handleLogin} className={styles.form}>
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
        <button type="submit" className={styles.button}>Login</button>
        <div className={styles.link}>
            <span className={styles.inside}>Does not have an account? <Link href="/register">Register</Link></span>
        </div>
      </form>
    </div>
  );
}
