
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";
import { storage, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Camera, CheckCircle, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/icons/logo";

export default function FaceRegistrationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const [isLoading, setIsLoading] = React.useState(false);
  const [hasCameraPermission, setHasCameraPermission] = React.useState(true);
  const [isComplete, setIsComplete] = React.useState(false);

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);
  
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

  const handleCaptureAndUpload = async () => {
    if (!videoRef.current || !user) {
        toast({ variant: 'destructive', title: 'Error', description: 'Camera or user not available.' });
        return;
    };
    setIsLoading(true);

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext('2d');
    context?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUri = canvas.toDataURL('image/jpeg');

    const storageRef = ref(storage, `face_profiles/${user.uid}.jpg`);
    
    try {
        await uploadString(storageRef, dataUri, 'data_url');
        const photoURL = await getDownloadURL(storageRef);

        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
            faceRegistered: true,
            facePhotoUrl: photoURL,
        });

        setIsComplete(true);
        toast({ title: 'Face Registered Successfully!', description: 'You will be redirected to the dashboard.' });

        setTimeout(() => router.push('/'), 2000);

    } catch (error) {
        console.error("Error uploading face profile:", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not save your face profile. Please try again.' });
    } finally {
        setIsLoading(false);
    }
  };


  if (loading || !user) {
    return (
        <div className="flex min-h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 font-body animate-fade-in-up">
       <div className="absolute top-8 left-8 flex items-center gap-2">
         <Logo className="h-7 w-7 text-primary" />
         <h1 className="text-xl font-bold tracking-tighter text-foreground font-headline">
           DataSnatcher
         </h1>
       </div>
       
       {isComplete ? (
            <Card className="w-full max-w-md text-center border-primary/20 bg-card/80 backdrop-blur-sm">
               <CardHeader>
                   <CardTitle className="font-headline text-2xl tracking-tight">Setup Complete!</CardTitle>
               </CardHeader>
               <CardContent className="flex flex-col items-center gap-4">
                   <CheckCircle className="h-20 w-20 text-primary" />
                   <p>Your face has been registered successfully.</p>
                   <p className="text-muted-foreground">Redirecting you to the dashboard...</p>
               </CardContent>
            </Card>
       ) : (
        <Card className="w-full max-w-md border-primary/20 bg-card/80 backdrop-blur-sm">
          <CardHeader className="text-center">
             <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
                <ShieldCheck className="h-8 w-8" />
             </div>
            <CardTitle className="font-headline text-2xl tracking-tight">Register Your Face</CardTitle>
            <CardDescription>
              This is the final step. Position your face in the center of the frame and we'll do the rest.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
              {!hasCameraPermission ? (
                  <Alert variant="destructive">
                      <Camera className="h-4 w-4" />
                      <AlertTitle>Camera Access Required</AlertTitle>
                      <AlertDescription>
                      Please allow camera access to complete registration. Refresh the page after granting permission.
                      </AlertDescription>
                  </Alert>
              ) : (
                  <>
                      <div className="relative w-full aspect-video overflow-hidden rounded-lg glow-border">
                          <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                          <div className="absolute inset-0 bg-black/20" />
                      </div>
                      <Button onClick={handleCaptureAndUpload} className="w-full" disabled={isLoading || !hasCameraPermission}>
                          {isLoading ? <Loader2 className="animate-spin" /> : <> <Camera className="mr-2" /> Capture & Complete Setup </> }
                      </Button>
                  </>
              )}
          </CardContent>
        </Card>
       )}
    </div>
  );
}