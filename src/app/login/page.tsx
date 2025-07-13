
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { verifyFace } from "@/ai/flows/face-verification";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Camera, UserCheck, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/icons/logo";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = React.useState(false);
  const [loginStep, setLoginStep] = React.useState<'credentials' | 'face'>('credentials');
  const [userId, setUserId] = React.useState<string | null>(null);
  const [showPassword, setShowPassword] = React.useState(false);


  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const handleCredentialSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, values.email, values.password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists() || !userDoc.data()?.faceRegistered) {
        toast({
          variant: "destructive",
          title: "Registration Incomplete",
          description: "Please complete the face registration step.",
        });
        await auth.signOut();
        router.push("/register");
        return;
      }
      
      setUserId(user.uid);
      setLoginStep('face');

    } catch (error: any) {
      const errorCode = error.code || "unknown";
      let errorMessage = "An unexpected error occurred. Please try again.";
      if (errorCode === "auth/user-not-found" || errorCode === "auth/wrong-password" || errorCode === "auth/invalid-credential") {
        errorMessage = "Invalid email or password. Please check your credentials and try again.";
      }
      toast({ variant: "destructive", title: "Login Failed", description: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 font-body animate-fade-in-up">
       <div className="absolute top-8 left-8 flex items-center gap-2">
         <Logo className="h-7 w-7 text-primary" />
         <h1 className="text-xl font-bold tracking-tighter text-foreground font-headline">
           DataSnatcher
         </h1>
       </div>
      <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            {loginStep === 'credentials' ? <UserCheck className="h-8 w-8" /> : <ShieldCheck className="h-8 w-8" />}
          </div>
          <CardTitle className="font-headline text-2xl tracking-tight">
             {loginStep === 'credentials' ? 'Secure Login' : 'Identity Verification'}
          </CardTitle>
          <CardDescription>
            {loginStep === 'credentials' ? 'Welcome back. Please enter your credentials.' : 'Verify your identity using our secure face scan.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginStep === 'credentials' ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCredentialSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="name@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                           <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-primary"
                            >
                              {showPassword ? <EyeOff /> : <Eye />}
                            </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : 'Continue'}
                </Button>
              </form>
            </Form>
          ) : (
            userId && <FaceVerificationStep userId={userId} />
          )}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="font-semibold text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


function FaceVerificationStep({ userId }: { userId: string }) {
    const router = useRouter();
    const { toast } = useToast();
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [hasCameraPermission, setHasCameraPermission] = React.useState(true);
  
    React.useEffect(() => {
      let stream: MediaStream | null = null;
      const getCameraPermission = async () => {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          setHasCameraPermission(true);
        } catch (error) {
          console.error("Error accessing camera:", error);
          setHasCameraPermission(false);
        }
      };
      getCameraPermission();

      return () => {
        stream?.getTracks().forEach(track => track.stop());
      }
    }, []);
  
    const handleVerifyFace = async () => {
      if (!videoRef.current) return;
      setIsLoading(true);
  
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');
      context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const faceImageDataUri = canvas.toDataURL('image/jpeg');
  
      try {
        const { isVerified } = await verifyFace({ userId, faceImageDataUri });
  
        if (isVerified) {
          toast({ title: "Login Successful", description: "Welcome back!" });
          router.push("/");
        } else {
          toast({ variant: "destructive", title: "Face Verification Failed", description: "Could not verify your identity. Please try again." });
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Verification Error", description: "An error occurred during face verification." });
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
  
    return (
      <div className="flex flex-col items-center gap-4">
        {!hasCameraPermission ? (
            <Alert variant="destructive">
                <Camera className="h-4 w-4" />
                <AlertTitle>Camera Access Denied</AlertTitle>
                <AlertDescription>
                Please enable camera permissions in your browser settings to log in.
                </AlertDescription>
            </Alert>
        ) : (
            <>
                <div className="relative w-full aspect-video overflow-hidden rounded-lg glow-border">
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                    <div className="absolute inset-0 bg-black/20" />
                </div>
                 <Button onClick={handleVerifyFace} className="w-full" disabled={isLoading || !hasCameraPermission}>
                    {isLoading ? <Loader2 className="animate-spin" /> : <> <ShieldCheck className="mr-2" /> Verify Face </>}
                </Button>
            </>
        )}
      </div>
    );
  }